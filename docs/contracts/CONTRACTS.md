# CONTRACTS.md — ARGUS (append-only)

> Changing a locked REAL contract requires a breaking-change flag + re-issue to dependents.

## REAL contracts

### CONTRACT-001 — audit_log
Fields: `id` UUID PK, `timestamp`, `user_id`→users, `role` enum(investigator, admin, analyst), `action_type` enum(ask_query, see_view, predict_view, admin_action), `endpoint`, `request_summary`, `ai_output_ref`→ask_responses nullable, `source_records` uuid[] nullable, `created_at`.

### CONTRACT-002 — RBAC
- Investigator: ASK R/W, SEE read; no PREDICT; no audit export
- Analyst (TASK-016): ASK+SEE + PREDICT read/tune; no admin user mgmt / audit export
- Admin: full including user mgmt + audit export

### CONTRACT-003 — Critic unsupported claim
A claim is UNSUPPORTED if no retrieved record contains a matching **entity+attribute pair**. Flagged claims stripped/downgraded with visible confidence caveat. Frontend must render correction visibly.

### CONTRACT-004 — Auth
JWT, stateless. Redis is NOT auth state store.

### CONTRACT-005 — SEE delivery (MVP)
Batch-refreshed REST GET only. WebSocket = Tier 3 breaking change.

### CONTRACT-006 — Redis
Session/query cache only; no pub/sub until TASK-013.

### CONTRACT-007 — Case schema
Entities: Case, Person-ref, Location, Incident, Officer, Station (+ users, ask_responses, audit_log, anomaly_flags, notifications, billing_subscriptions). Column-level in `db/schema.sql`. Embedding: `vector(384)` hashing-trick embedder in `db/embed.py` (swap path: sentence-transformers).

## PLACEHOLDER REPLACEMENT NOTES (implemented)

| Placeholder | Real owner | Status |
|-------------|------------|--------|
| A ASK response | TASK-003 / ml/ask_pipeline | **Replaced** — shape `{answer,citations,confidence,correction,audit_id}` |
| B SEE heatmap | see/router | **Replaced** — `{points[{lat,lng,intensity,zone_id}], last_updated, anomalies}` |
| C Mock auth | auth/router | **Replaced** — real JWT |
| D PREDICT | predict/router | **Replaced** — `{zone_id,time_window,risk_score,shap_values,confidence,model}` |

## Pinned dependencies (exact)

### Backend
fastapi==0.115.6, uvicorn==0.34.0, python-jose[cryptography]==3.3.0, passlib[bcrypt]==1.7.4, bcrypt==4.0.1, psycopg2-binary==2.9.10, pydantic[email]==2.10.4, pydantic-settings==2.7.0, redis==5.2.1, faker==33.1.0, scikit-learn==1.6.0, shap==0.46.0, joblib==1.4.2, networkx==3.4.2, numpy==2.2.1, httpx==0.28.1, pytest==8.3.4

### Frontend map library
**Leaflet** (+ react-leaflet) — TASK-006 choice recorded.

### Canary
- ID: `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`
- FIR: `FIR-CANARY-2026-0001`
- Question: `What weapon was used in the MG Road theft case FIR-CANARY-2026-0001?`
