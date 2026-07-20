from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from backend.audit.service import write_audit
from backend.rbac import TokenUser, require_permission
from ml.gbm_model import predict_zone_time, train_and_save

router = APIRouter(prefix="/predict", tags=["predict"])


class PredictRequest(BaseModel):
    zone_id: str = Field(default="BLR-MG")
    hour: int = Field(default=20, ge=0, le=23)
    dow: int = Field(default=5, ge=0, le=6)


@router.post("")
def predict(
    body: PredictRequest,
    user: Annotated[TokenUser, Depends(require_permission("predict:read"))],
) -> dict[str, Any]:
    result = predict_zone_time(body.zone_id, body.hour, body.dow)
    write_audit(
        user_id=user.id,
        role=user.role.value,
        action_type="predict_view",
        endpoint="/api/v1/predict",
        request_summary=f"{body.zone_id} h={body.hour} dow={body.dow}",
    )
    return result


@router.get("")
def predict_get(
    user: Annotated[TokenUser, Depends(require_permission("predict:read"))],
    zone_id: str = Query("BLR-MG"),
    hour: int = Query(20, ge=0, le=23),
    dow: int = Query(5, ge=0, le=6),
) -> dict[str, Any]:
    result = predict_zone_time(zone_id, hour, dow)
    write_audit(
        user_id=user.id,
        role=user.role.value,
        action_type="predict_view",
        endpoint="/api/v1/predict",
        request_summary=f"{zone_id} h={hour} dow={dow}",
    )
    return result


@router.post("/train")
def train(user: Annotated[TokenUser, Depends(require_permission("predict:tune"))]):
    return train_and_save()
