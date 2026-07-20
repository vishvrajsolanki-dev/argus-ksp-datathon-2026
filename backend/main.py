"""ARGUS FastAPI application."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.ask.router import router as ask_router
from backend.audit.router import router as audit_router
from backend.auth.router import router as auth_router
from backend.billing.router import router as billing_router
from backend.crosslink.router import router as crosslink_router
from backend.graph.router import router as graph_router
from backend.notifications.router import router as notifications_router
from backend.predict.router import router as predict_router
from backend.see.router import router as see_router
from backend.admin.router import router as admin_router

app = FastAPI(title="ARGUS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(ask_router, prefix="/api/v1")
app.include_router(see_router, prefix="/api/v1")
app.include_router(predict_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(billing_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(crosslink_router, prefix="/api/v1")
app.include_router(graph_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "service": "argus"}
