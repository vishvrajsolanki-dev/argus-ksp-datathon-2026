from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.database import fetchone
from backend.rbac import TokenUser, get_current_user

router = APIRouter(prefix="/crosslink", tags=["crosslink"])


class PinRequest(BaseModel):
    case_ref: str | None = None
    zone_id: str | None = None
    source: str
    target: str


@router.post("/resolve")
def resolve(body: PinRequest, user: Annotated[TokenUser, Depends(get_current_user)]) -> dict[str, Any]:
    context: dict[str, Any] = {
        "source": body.source,
        "target": body.target,
        "case_ref": body.case_ref,
        "zone_id": body.zone_id,
        "fallback": None,
    }
    if body.case_ref:
        row = fetchone(
            """SELECT c.fir_number, c.summary, l.zone_id, l.lat, l.lng, l.label
               FROM cases c LEFT JOIN locations l ON c.location_id=l.id
               WHERE c.fir_number=%s""",
            (body.case_ref,),
        )
        if not row:
            context["fallback"] = "No matching ASK-answerable record for this pin."
        else:
            context["record"] = dict(row)
            context["zone_id"] = row["zone_id"]
    elif body.zone_id:
        row = fetchone(
            """SELECT c.fir_number, c.summary, l.zone_id, l.label
               FROM locations l
               JOIN cases c ON c.location_id=l.id
               WHERE l.zone_id=%s
               ORDER BY c.occurred_at DESC LIMIT 1""",
            (body.zone_id,),
        )
        if not row:
            context["fallback"] = "No matching case in this hotspot zone."
        else:
            context["record"] = dict(row)
            context["suggested_query"] = (
                f"Summarize recent cases in zone {body.zone_id} near {row['label']}."
            )
    return context
