"""
Generate deterministic 384-d embeddings for case summaries (no external API required).
Uses hashing trick + token bag for stable similarity — production swap: sentence-transformers.
"""
from __future__ import annotations

import hashlib
import math
import os
import re

import psycopg2
from psycopg2.extras import execute_values

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://argus:argus@localhost:5432/argus",
)
DIM = 384


def embed_text(text: str, dim: int = DIM) -> list[float]:
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    vec = [0.0] * dim
    if not tokens:
        return vec
    for tok in tokens:
        h = hashlib.sha256(tok.encode("utf-8")).digest()
        idx = int.from_bytes(h[:4], "big") % dim
        sign = 1.0 if h[4] % 2 == 0 else -1.0
        vec[idx] += sign
    # L2 normalize
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def to_pgvector(vec: list[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in vec) + "]"


def main():
    conn = psycopg2.connect(DATABASE_URL)
    with conn.cursor() as cur:
        cur.execute("SELECT id, fir_number, category, summary, attributes::text FROM cases")
        rows = cur.fetchall()
        updates = []
        for case_id, fir, category, summary, attrs in rows:
            text = f"{fir} {category} {summary} {attrs}"
            updates.append((to_pgvector(embed_text(text)), str(case_id)))
        for emb, cid in updates:
            cur.execute("UPDATE cases SET embedding = %s::vector WHERE id = %s", (emb, cid))
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_cases_embedding
            ON cases USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50)
            """
        )
        cur.execute("SELECT COUNT(*) FROM cases WHERE embedding IS NOT NULL")
        embedded = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM cases")
        total = cur.fetchone()[0]
        print(f"embedded={embedded} total={total}")
        # canary self-retrieval sanity
        cur.execute(
            """
            SELECT c2.fir_number
            FROM cases c1
            JOIN cases c2 ON true
            WHERE c1.is_canary = TRUE AND c2.embedding IS NOT NULL AND c1.embedding IS NOT NULL
            ORDER BY c1.embedding <=> c2.embedding
            LIMIT 1
            """
        )
        top = cur.fetchone()
        print(f"canary_top_match={top[0] if top else None}")
    conn.commit()
    conn.close()


if __name__ == "__main__":
    main()
