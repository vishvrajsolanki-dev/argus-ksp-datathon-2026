from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from backend.database import execute, fetchall
from backend.rbac import TokenUser, require_permission

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(user: Annotated[TokenUser, Depends(require_permission("notifications:read"))]):
    return fetchall(
        """SELECT id, title, body, kind, read, created_at
           FROM notifications WHERE user_id=%s OR user_id IS NULL
           ORDER BY created_at DESC LIMIT 50""",
        (user.id,),
    )


@router.post("/{notification_id}/read")
def mark_read(
    notification_id: str,
    user: Annotated[TokenUser, Depends(require_permission("notifications:read"))],
):
    execute(
        "UPDATE notifications SET read=TRUE WHERE id=%s AND user_id=%s RETURNING id",
        (notification_id, user.id),
    )
    return {"ok": True}
