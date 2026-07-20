from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse

from backend.database import fetchall
from backend.rbac import TokenUser, require_permission

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/export")
def export_audit(user: Annotated[TokenUser, Depends(require_permission("admin:audit_export"))]):
    rows = fetchall(
        """SELECT id, timestamp, user_id, role, action_type, endpoint, request_summary,
                  ai_output_ref, source_records
           FROM audit_log ORDER BY timestamp DESC LIMIT 5000"""
    )
    lines = ["id,timestamp,user_id,role,action_type,endpoint,request_summary,ai_output_ref"]
    for r in rows:
        lines.append(
            f"{r['id']},{r['timestamp']},{r['user_id']},{r['role']},{r['action_type']},"
            f"{r['endpoint']},\"{(r['request_summary'] or '').replace('\"','')}\",{r['ai_output_ref']}"
        )
    return PlainTextResponse("\n".join(lines), media_type="text/csv")


@router.get("/recent")
def recent(user: Annotated[TokenUser, Depends(require_permission("admin:audit_export"))]):
    return fetchall(
        """SELECT id, timestamp, role, action_type, endpoint, request_summary
           FROM audit_log ORDER BY timestamp DESC LIMIT 100"""
    )
