# ARGUS — Unified Crime Intelligence Platform

Ask. See. Predict. One audited truth.

Commercial GovTech SaaS built on the ARGUS shared data spine for Karnataka State Police / Datathon 2026 context.

## Stack

- **Frontend:** React (Vite) — Landing, Auth, ASK / SEE / PREDICT, Billing, Admin, Notifications
- **Backend:** FastAPI — JWT RBAC, audit log, ASK advisor+critic, SEE heatmap, PREDICT GBM+SHAP
- **Database:** Postgres + pgvector
- **Cache:** Redis (session/query cache scope)
- **Deploy:** Docker Compose → Render-ready

## Quick start (local)

```bash
# Postgres with pgvector + Redis required
export DATABASE_URL=postgresql://argus:argus@localhost:5432/argus
export JWT_SECRET=argus-dev-secret
export PYTHONPATH=$PWD

pip install -r backend/requirements.txt
python db/seed.py --reset
python db/embed.py
python -c "from ml.gbm_model import train_and_save; train_and_save()"

uvicorn backend.main:app --reload --port 8000

cd frontend && npm install && npm run dev
```

Demo users (password `pilot123`):

- `investigator@example.com` — ASK + SEE
- `analyst@example.com` — + PREDICT
- `admin@example.com` — full admin + audit export

**Canary question (critic demo):**
> What weapon was used in the MG Road theft case FIR-CANARY-2026-0001?

## Docker

```bash
docker compose up --build
```

## Ethics

Zone-time risk only — never person-level profiling. Synthetic NCRB-calibrated corpus. DPDP Act 2023 review required before any real KSP data.

## Design

Locked Phase 7 decisions live in `docs/design/`.

## Contracts

See `docs/contracts/CONTRACTS.md`.
