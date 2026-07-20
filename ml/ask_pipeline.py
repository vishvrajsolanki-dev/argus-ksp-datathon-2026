"""ASK pipeline — retrieval + advisor + critic (CONTRACT-003)."""
from __future__ import annotations

import re
import time
from collections import defaultdict
from typing import Any
from uuid import UUID

from backend.database import execute, fetchall, fetchone
from db.embed import embed_text, to_pgvector

# Session rate limit (CONTRACT / TASK-003)
_rate_buckets: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = 30
WINDOW_SEC = 3600

CANARY_FIR = "FIR-CANARY-2026-0001"


def check_rate_limit(session_key: str) -> None:
    now = time.time()
    bucket = _rate_buckets[session_key]
    _rate_buckets[session_key] = [t for t in bucket if now - t < WINDOW_SEC]
    if len(_rate_buckets[session_key]) >= RATE_LIMIT:
        raise RuntimeError("ASK rate limit exceeded for session")
    _rate_buckets[session_key].append(now)


def extract_intent_entities(query: str) -> dict[str, Any]:
    q = query.lower()
    fir_match = re.search(r"fir-[a-z0-9\-]+", q, re.I)
    entities = {
        "fir": fir_match.group(0).upper() if fir_match else None,
        "wants_weapon": "weapon" in q,
        "wants_location": any(w in q for w in ("where", "location", "map", "zone")),
        "category": next(
            (c for c in ("theft", "burglary", "robbery", "assault", "fraud") if c in q),
            None,
        ),
    }
    intent = "case_lookup" if entities["fir"] else "semantic_search"
    return {"intent": intent, "entities": entities}


def retrieve_cases(query: str, limit: int = 5) -> list[dict]:
    intent = extract_intent_entities(query)
    fir = intent["entities"]["fir"]
    if fir:
        rows = fetchall(
            """SELECT id, fir_number, category, summary, attributes, occurred_at, is_canary
               FROM cases WHERE fir_number ILIKE %s LIMIT %s""",
            (fir, limit),
        )
        if rows:
            return rows
    emb = to_pgvector(embed_text(query))
    return fetchall(
        """SELECT id, fir_number, category, summary, attributes, occurred_at, is_canary,
                  1 - (embedding <=> %s::vector) AS score
           FROM cases
           WHERE embedding IS NOT NULL
           ORDER BY embedding <=> %s::vector
           LIMIT %s""",
        (emb, emb, limit),
    )


def advisor_draft(query: str, records: list[dict]) -> dict[str, Any]:
    """Draft answer grounded in records. For canary weapon question, deliberately
    includes an unsupported weapon claim so critic can demonstrate CONTRACT-003."""
    if not records:
        return {
            "answer": "I could not find supporting records for that question.",
            "claims": [],
            "citations": [],
        }

    q_lower = query.lower()
    # Refuse attributes we never store (anti-hallucination)
    forbidden_attrs = ("blood type", "blood_type", "aadhaar", "phone number of officer", "home address")
    if any(f in q_lower for f in forbidden_attrs):
        return {
            "answer": (
                "I cannot answer that from the ARGUS case corpus. "
                "No retrieved records contain that attribute, and I will not invent a citation."
            ),
            "claims": [],
            "citations": [],
        }

    citations = []
    claims = []
    for r in records:
        attrs = r["attributes"] if isinstance(r["attributes"], dict) else {}
        excerpt = r["summary"][:180]
        citations.append(
            {
                "record_id": str(r["id"]),
                "excerpt": excerpt,
                "case_ref": r["fir_number"],
            }
        )
        claims.append(
            {
                "entity": r["fir_number"],
                "attribute": "category",
                "value": r["category"],
                "supported": True,
            }
        )
        if attrs.get("weapon"):
            claims.append(
                {
                    "entity": r["fir_number"],
                    "attribute": "weapon",
                    "value": attrs["weapon"],
                    "supported": True,
                }
            )
        elif attrs.get("weapon_reported") is False:
            claims.append(
                {
                    "entity": r["fir_number"],
                    "attribute": "weapon",
                    "value": None,
                    "supported": True,
                }
            )

    primary = records[0]
    attrs = primary["attributes"] if isinstance(primary["attributes"], dict) else {}
    parts = [
        f"Based on {primary['fir_number']} ({primary['category']}): {primary['summary']}"
    ]

    # Canary demo path: advisor adds unsupported knife claim
    if (
        primary.get("is_canary")
        or primary["fir_number"] == CANARY_FIR
        or CANARY_FIR.lower() in q_lower
    ) and "weapon" in q_lower:
        unsupported = {
            "entity": primary["fir_number"],
            "attribute": "weapon",
            "value": "knife",
            "supported": False,
        }
        claims.append(unsupported)
        parts.append(
            f"The weapon used in {primary['fir_number']} was a knife."
        )

    return {"answer": " ".join(parts), "claims": claims, "citations": citations}


def critic_check(draft: dict[str, Any], records: list[dict]) -> dict[str, Any]:
    """CONTRACT-003: unsupported if no retrieved record contains matching entity+attribute pair."""
    record_index: dict[str, dict] = {}
    for r in records:
        attrs = r["attributes"] if isinstance(r["attributes"], dict) else {}
        record_index[r["fir_number"]] = {
            "category": r["category"],
            "weapon": attrs.get("weapon"),
            "weapon_reported": attrs.get("weapon_reported"),
            "property": attrs.get("property"),
            "modus": attrs.get("modus"),
            "summary": r["summary"],
        }

    flagged = []
    for claim in draft.get("claims", []):
        entity = claim["entity"]
        attr = claim["attribute"]
        value = claim.get("value")
        rec = record_index.get(entity)
        supported = False
        if rec is not None:
            if attr == "weapon":
                # Matching pair: weapon attribute exists with same value, OR explicit null when claim is null
                if value is None and rec.get("weapon_reported") is False and rec.get("weapon") in (None,):
                    supported = True
                elif value is not None and rec.get("weapon") == value:
                    supported = True
                else:
                    supported = False
            elif attr in rec and rec[attr] == value:
                supported = True
        if not supported and value is not None:
            flagged.append(
                {
                    "entity": entity,
                    "attribute": attr,
                    "value": value,
                    "reason": f"No retrieved record contains entity+attribute pair ({entity}, {attr}={value}).",
                }
            )

    if not flagged:
        return {
            "triggered": False,
            "original_claim": None,
            "flag_reason": None,
            "corrected_claim": None,
            "answer": draft["answer"],
            "confidence": 0.86 if records else 0.2,
        }

    flag = flagged[0]
    original = f"The {flag['attribute']} used in {flag['entity']} was a {flag['value']}."
    # Build corrected answer: strip unsupported sentences
    corrected_sentences = []
    for sentence in re.split(r"(?<=[.!?])\s+", draft["answer"]):
        if flag["value"] and str(flag["value"]).lower() in sentence.lower():
            continue
        corrected_sentences.append(sentence)
    # Add explicit correction
    entity_rec = record_index.get(flag["entity"], {})
    if entity_rec.get("weapon_reported") is False or entity_rec.get("weapon") in (None,):
        correction_line = (
            f"Correction: No weapon was reported for {flag['entity']}. "
            "The earlier weapon claim was unsupported by retrieved records."
        )
    else:
        correction_line = (
            f"Correction: Retrieved records do not support {flag['attribute']}={flag['value']} "
            f"for {flag['entity']}."
        )
    corrected = (" ".join(s for s in corrected_sentences if s).strip() + " " + correction_line).strip()

    return {
        "triggered": True,
        "original_claim": original,
        "flag_reason": flag["reason"],
        "corrected_claim": correction_line,
        "answer": corrected,
        "confidence": 0.55,
    }


def run_ask(query: str, user_id: str, role: str) -> dict[str, Any]:
    check_rate_limit(user_id)
    records = retrieve_cases(query)
    draft = advisor_draft(query, records)
    critique = critic_check(draft, records)
    final_answer = critique["answer"]
    correction = {
        "triggered": critique["triggered"],
        "original_claim": critique["original_claim"],
        "flag_reason": critique["flag_reason"],
        "corrected_claim": critique["corrected_claim"],
    }
    citations = draft["citations"]
    confidence = critique["confidence"]

    # Persist ask_response
    payload = {
        "answer": final_answer,
        "citations": citations,
        "confidence": confidence,
        "correction": correction,
        "advisor_draft": draft["answer"],
    }
    row = execute(
        """INSERT INTO ask_responses (user_id, query, answer, payload)
           VALUES (%s,%s,%s,%s::jsonb) RETURNING id""",
        (user_id, query, final_answer, __import__("json").dumps(payload)),
    )
    source_ids = [c["record_id"] for c in citations]
    from backend.audit.service import write_audit

    audit_id = write_audit(
        user_id=user_id,
        role=role,
        action_type="ask_query",
        endpoint="/api/v1/ask",
        request_summary=query[:500],
        ai_output_ref=str(row["id"]),
        source_records=source_ids or None,
    )
    return {
        "answer": final_answer,
        "citations": citations,
        "confidence": confidence,
        "correction": correction,
        "audit_id": audit_id,
    }
