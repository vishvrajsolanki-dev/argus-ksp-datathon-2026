from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from backend.database import fetchall, fetchone
from backend.rbac import TokenUser, require_permission

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
def list_users(user: Annotated[TokenUser, Depends(require_permission("admin:users"))]):
    return fetchall(
        "SELECT id, email, full_name, role, org_name, is_verified, created_at FROM users ORDER BY created_at"
    )


@router.get("/health-detail")
def health_detail(user: Annotated[TokenUser, Depends(require_permission("admin:users"))]):
    counts = {}
    for table in ("cases", "incidents", "users", "audit_log"):
        row = fetchone(f"SELECT COUNT(*) AS c FROM {table}")
        counts[table] = row["c"]
    canary = fetchone("SELECT fir_number FROM cases WHERE is_canary=TRUE")
    return {"counts": counts, "canary": canary["fir_number"] if canary else None, "status": "ok"}
