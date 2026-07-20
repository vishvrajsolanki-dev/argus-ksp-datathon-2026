from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends

from backend.audit.service import write_audit
from backend.database import fetchall
from backend.rbac import TokenUser, require_permission

router = APIRouter(prefix="/see", tags=["see"])


@router.get("/heatmap")
def heatmap(user: Annotated[TokenUser, Depends(require_permission("see:read"))]) -> dict[str, Any]:
    rows = fetchall(
        """
        SELECT l.zone_id, l.lat, l.lng, COUNT(i.id)::float AS intensity
        FROM locations l
        LEFT JOIN incidents i ON i.location_id = l.id
        GROUP BY l.zone_id, l.lat, l.lng
        ORDER BY intensity DESC
        """
    )
    points = [
        {
            "lat": float(r["lat"]),
            "lng": float(r["lng"]),
            "intensity": float(r["intensity"]),
            "zone_id": r["zone_id"],
        }
        for r in rows
    ]
    write_audit(
        user_id=user.id,
        role=user.role.value,
        action_type="see_view",
        endpoint="/api/v1/see/heatmap",
        request_summary="heatmap",
    )
    anomalies = fetchall(
        "SELECT zone_id, time_window, z_score, message FROM anomaly_flags ORDER BY flagged_at DESC LIMIT 5"
    )
    return {
        "points": points,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "anomalies": anomalies,
    }
