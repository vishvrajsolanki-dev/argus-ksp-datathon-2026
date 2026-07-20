"""CONTRACT-002 RBAC + CONTRACT-004 JWT helpers."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Annotated, Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from backend.config import get_settings
from backend.database import fetchone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


class Role(str, Enum):
    investigator = "investigator"
    admin = "admin"
    analyst = "analyst"


# MVP permissions (CONTRACT-002 + TASK-016 Analyst)
ROLE_PERMISSIONS: dict[Role, set[str]] = {
    Role.investigator: {"ask:rw", "see:read", "notifications:read", "billing:read"},
    Role.analyst: {
        "ask:rw",
        "see:read",
        "predict:read",
        "predict:tune",
        "notifications:read",
        "billing:read",
    },
    Role.admin: {
        "ask:rw",
        "see:read",
        "predict:read",
        "predict:tune",
        "admin:users",
        "admin:audit_export",
        "notifications:read",
        "billing:manage",
    },
}


class TokenUser(BaseModel):
    id: str
    email: str
    role: Role
    full_name: str


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user: dict) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": str(user["id"]),
        "email": user["email"],
        "role": user["role"],
        "full_name": user["full_name"],
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> TokenUser:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return TokenUser(
            id=payload["sub"],
            email=payload["email"],
            role=Role(payload["role"]),
            full_name=payload.get("full_name", ""),
        )
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc


def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> TokenUser:
    if creds is None or not creds.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return decode_token(creds.credentials)


def require_permission(permission: str) -> Callable:
    def dependency(user: Annotated[TokenUser, Depends(get_current_user)]) -> TokenUser:
        allowed = ROLE_PERMISSIONS.get(user.role, set())
        if permission not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return dependency


def user_from_db(email: str):
    return fetchone("SELECT * FROM users WHERE email=%s", (email,))
