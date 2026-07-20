from __future__ import annotations

import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from backend.database import execute, fetchone
from backend.rbac import (
    Role,
    TokenUser,
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class RegisterRequest(BaseModel):
    email: str
    full_name: str = Field(min_length=2)
    password: str = Field(min_length=8)
    role: Role = Role.investigator

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError("Invalid email")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.strip().lower()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    authenticated: bool = True
    full_name: str
    email: str


@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest):
    if body.role == Role.admin:
        raise HTTPException(status_code=400, detail="Cannot self-register as admin")
    existing = fetchone("SELECT id FROM users WHERE email=%s", (body.email,))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    row = execute(
        """INSERT INTO users (email, full_name, hashed_password, role, is_verified)
           VALUES (%s,%s,%s,%s,%s)
           RETURNING id, email, role, full_name""",
        (body.email, body.full_name, hash_password(body.password), body.role.value, True),
    )
    token = create_access_token(row)
    return TokenResponse(
        access_token=token,
        role=Role(row["role"]),
        full_name=row["full_name"],
        email=row["email"],
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    user = fetchone("SELECT * FROM users WHERE email=%s", (body.email,))
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(user)
    return TokenResponse(
        access_token=token,
        role=Role(user["role"]),
        full_name=user["full_name"],
        email=user["email"],
    )


@router.get("/me")
def me(user: Annotated[TokenUser, Depends(get_current_user)]):
    return user
