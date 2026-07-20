import os
import sys

import pytest
from fastapi.testclient import TestClient

# Ensure imports resolve
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

os.environ.setdefault("DATABASE_URL", "postgresql://argus:argus@localhost:5432/argus")
os.environ.setdefault("JWT_SECRET", "argus-test-secret")

from backend.main import app
from backend.config import get_settings

get_settings.cache_clear()

client = TestClient(app)

CANARY_Q = "What weapon was used in the MG Road theft case FIR-CANARY-2026-0001?"


def _login(email: str, password: str = "pilot123") -> str:
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_login_and_me():
    token = _login("investigator@example.com")
    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["role"] == "investigator"


def test_bad_jwt_401():
    r = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not.a.jwt"})
    assert r.status_code == 401


def test_rbac_predict_forbidden_for_investigator():
    token = _login("investigator@example.com")
    r = client.get("/api/v1/predict", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


def test_rbac_admin_predict_ok():
    token = _login("admin@example.com")
    r = client.get(
        "/api/v1/predict",
        params={"zone_id": "BLR-MG", "hour": 20, "dow": 5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert "risk_score" in body
    assert isinstance(body["shap_values"], list)
    assert len(body["shap_values"]) >= 3


def test_ask_canary_critic_three_times():
    token = _login("investigator@example.com")
    for _ in range(3):
        r = client.post(
            "/api/v1/ask",
            headers={"Authorization": f"Bearer {token}"},
            json={"query": CANARY_Q},
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["correction"]["triggered"] is True
        assert body["correction"]["original_claim"]
        assert body["correction"]["flag_reason"]
        assert body["correction"]["corrected_claim"]
        assert body["audit_id"]


def test_ask_no_hallucinated_forbidden_attr():
    token = _login("investigator@example.com")
    r = client.post(
        "/api/v1/ask",
        headers={"Authorization": f"Bearer {token}"},
        json={"query": "What is the blood type of the officer on FIR-CANARY-2026-0001?"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["citations"] == []
    assert "will not invent" in body["answer"].lower() or "cannot answer" in body["answer"].lower()


def test_see_heatmap():
    token = _login("investigator@example.com")
    r = client.get("/api/v1/see/heatmap", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert len(r.json()["points"]) >= 1


def test_audit_export_admin_only():
    inv = _login("investigator@example.com")
    assert client.get("/api/v1/audit/export", headers={"Authorization": f"Bearer {inv}"}).status_code == 403
    adm = _login("admin@example.com")
    r = client.get("/api/v1/audit/export", headers={"Authorization": f"Bearer {adm}"})
    assert r.status_code == 200
    assert "action_type" in r.text


def test_analyst_predict():
    token = _login("analyst@example.com")
    r = client.get("/api/v1/predict", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
