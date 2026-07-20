from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.rbac import TokenUser, require_permission
from ml.ask_pipeline import run_ask

router = APIRouter(prefix="/ask", tags=["ask"])


class AskRequest(BaseModel):
    query: str = Field(min_length=3, max_length=2000)


@router.post("")
def ask(body: AskRequest, user: Annotated[TokenUser, Depends(require_permission("ask:rw"))]) -> dict[str, Any]:
    try:
        return run_ask(body.query, user.id, user.role.value)
    except RuntimeError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
