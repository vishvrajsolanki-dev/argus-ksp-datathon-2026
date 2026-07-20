from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from backend.database import fetchone
from backend.rbac import TokenUser, require_permission

router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/subscription")
def subscription(user: Annotated[TokenUser, Depends(require_permission("billing:read"))]):
    row = fetchone(
        "SELECT id, org_name, plan, seats, status, ask_quota_monthly, ask_used, created_at FROM billing_subscriptions ORDER BY created_at DESC LIMIT 1"
    )
    plans = [
        {"id": "pilot", "name": "Pilot", "seats": 10, "price": "₹0", "ask_quota": 500},
        {"id": "station", "name": "Station", "seats": 50, "price": "Contact", "ask_quota": 5000},
        {"id": "command", "name": "Command", "seats": 200, "price": "Contact", "ask_quota": 50000},
    ]
    return {"subscription": row, "plans": plans}
