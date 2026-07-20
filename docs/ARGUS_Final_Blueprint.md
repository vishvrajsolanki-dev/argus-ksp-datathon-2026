# ARGUS — Unified Crime Intelligence Platform
### Final Committed Product | VERONICA design → YONDU brutal review → shipped spec

---

## 0. WHY THIS NAME, WHY THIS SHAPE

Both problem statements you attached (conversational AI for KSP's crime database, and an AI-driven crime analytics/visualization platform) are not two products. They are two *faces* of one need: give an investigator one place to ask, see, and predict. Splitting them into separate apps is what a hackathon team does under time pressure. A platform Karnataka Police could actually deploy does not make an officer choose between "the chatbot" and "the dashboard" — it gives them one login, one case graph, one audit trail, and three ways to interact with the same intelligence layer.

**ARGUS** — one platform, three faces, one shared spine.

```text
                    ┌─────────────────────┐
                    │   SHARED DATA SPINE  │
                    │  (case graph, audit, │
                    │   RBAC, embeddings)  │
                    └──────────┬──────────┘
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
        ASK (chat)        SEE (map/graph)    PREDICT (risk)
     grounded Q&A with   live hotspots +      zone-time risk
     citations + audit   case link graph      scores + reasons
```

No module exists in isolation. A question asked in ASK can pin a result on SEE. A hotspot clicked in SEE can trigger a PREDICT explanation. A risk spike in PREDICT can be interrogated conversationally in ASK. That interconnection is the actual product — not three features bolted together.

---

## 1. THE HONEST STARTING POINT (what your history actually proves)

Pulled from ARC, Lexis, RupeeIQ, TrackBot, and the five deployed ML briefs — not aspirational, only what's demonstrated:

| Proven strength | Where it showed up | Where it's used in ARGUS |
|---|---|---|
| Multi-agent RAG (advisor + critic) | ARC's DS/ML/AI three-pillar design | ASK face — grounded answers with a critique pass |
| Explainability as default, not add-on | SHAP in every single ML brief (CardioLens, Credit Scoring, LetterLens) | PREDICT face — every score ships with its reasons |
| Honest synthetic data generation when real data is unavailable | RupeeIQ's rebuilt `CATEGORY_BLUEPRINT` generator | Data layer — realistic synthetic FIR corpus for demo |
| Real-time WebSocket telemetry + FSM discipline | TrackBot's Core 0/Core 1 split, <50ms dashboard | SEE face — live incident feed |
| Killing a working approach when it doesn't fit the real input | LetterLens EMNIST→MNIST pivot | Design discipline applied below — Kannada/voice, graph DB cut from MVP |
| Cross-DB dependency debugging under real deploy constraints | Lexis Fly.io→Render pivot, RupeeIQ's numpy/pandas conflict | Infra choices below are deliberately boring and proven-compatible |

**What's unproven and therefore NOT load-bearing in this design:** Indic-language ASR/NLP, graph databases (Neo4j), Kubernetes-grade orchestration, any streaming system beyond WebSocket. Where these would normally appear in a "real" version of this product, they're named explicitly as Phase 2 roadmap, not MVP scope.

---

## 2. YONDU BRUTAL REVIEW — condensed to what actually mattered

Full 15-point review run; only the points that changed the design are shown. Everything else passed clean.

| # | Issue found | Severity | Fix applied |
|---|---|---|---|
| 1 | "Vector DB + relational DB" as two services is unjustified infra weight for this scale | Medium | Collapsed to **Postgres + pgvector** — one database, one connection pool, no sync problem between two stores |
| 2 | Full bilingual voice interface as a core feature — zero prior Indic-language work in your history | High | Cut from MVP entirely. English-first. Kannada listed as Phase 2 with `IndicTrans2` named, not assumed |
| 3 | Individual-level "behavioral profiling" reads as predictive-policing bias to any judge with civil-liberties awareness | High | Removed. All risk scoring is **zone-time**, never person-level. This is stated explicitly in the product's ethics page, which becomes a demo talking point, not a liability |
| 4 | Neo4j for link analysis — unproven tech, real operational risk in a 30-hour build | High | Swapped for **NetworkX in-process** on the same Postgres data. Scalability ceiling is named honestly (see §9) rather than hidden |
| 5 | "Streaming pipelines" listed as a requirement category — not justified at this data volume | Medium | Cut. A 5-second polling refresh via WebSocket achieves the same demo effect (live-feeling) without Kafka-class infrastructure that a student team cannot debug live at 2am |
| 6 | No real dataset — "criminal network analysis" implies real names/cases, which is both unavailable and legally reckless to fabricate convincingly | Showstopper if unaddressed | Explicit synthetic data strategy (§6) using NCRB-published aggregate statistics for realism, fully synthetic entities. This is disclosed on-stage, not hidden — mirrors your own RupeeIQ precedent of transparent synthetic data |
| 7 | RBAC listed as a bullet point with no actual model behind it | Medium | Defined concrete 3-role model in §7 — not decorative |
| 8 | Demo risk: LLM-based agents can visibly hallucinate live in front of judges | High | The critic-agent pass is the answer to this — its entire job is catching that, and *showing the catch happening* is turned into the wow-factor moment (§5) instead of being a hidden safety net |
| 9 | "Would a police officer use this daily" — original network-graph-first idea failed this test; officers don't want a graph, they want an answer | Medium | ASK is the primary face; SEE and PREDICT are secondary lenses reached *from* an answer, not the entry point |

**Verdict: Category 2 → fixed → Category 3.** No remaining Showstopper or unaddressed High-severity issue.

---

## 3. WHAT ARGUS ACTUALLY DOES

**One-line pitch:** ARGUS lets an investigator ask a question in plain language, get a grounded and cited answer, see it plotted on a live map, and understand which zones and time windows carry elevated risk — all from one login, with every action logged and every AI output traceable to its source.

### 3.1 ASK — Investigator Copilot
- Natural-language query → intent + entity extraction
- Grounded retrieval over the case corpus (pgvector similarity search)
- **Advisor agent** drafts an answer from retrieved records
- **Critic agent** independently checks the draft against the same retrieved records, flags unsupported claims, revises or rejects
- Final answer ships with a confidence score and clickable citations back to source case records
- Every ASK query and answer is written to the audit log automatically

### 3.2 SEE — Live Command View
- Geospatial hotspot heatmap, station/district drilldown
- Case/location link graph (NetworkX) — surfaces which cases or locations share entities (same address pattern, same MO tags, same time window)
- Anomaly banner — statistical deviation alert when a station's incident rate breaks its own historical pattern
- Any ASK answer can be "pinned" here; any map click can be "asked about" — this cross-link is what makes it one product, not two

### 3.3 PREDICT — Zone-Time Risk Engine
- Gradient-boosted risk score per zone × time-window, trained on historical incident density, calendar effects (festivals, paydays, weekends)
- SHAP breakdown shown for every score — "why is this zone flagged" is always answerable, never a black box
- Explicitly zone-level, never person-level — this is a design decision stated on the product itself, not a silent limitation

---

## 4. THE "ONE FINAL TEST" APPLIED — feature by feature

Every module below was run against your 8-question test. Only what passed all 8 survived into the spec.

| Feature | Daily use? | Faster/smarter/safer? | Real op. problem? | Improves decisions? | Demo-able? | Buildable by student team? | Survives past hackathon? | Worth building w/ funding? | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| ASK grounded Q&A | Yes | Yes | Yes — replaces manual query-writing | Yes | Yes — highest wow factor | Yes | Yes | Yes | **KEEP — flagship** |
| Critic-agent visible check | Indirect | Yes — trust, not speed | Yes — hallucination risk is real | Yes | Yes — the moment | Yes | Yes | Yes | **KEEP — differentiator** |
| SEE hotspot map | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | **KEEP** |
| SEE link graph | Occasional | Yes | Yes | Yes | Yes, visually | Yes (NetworkX) | Ceiling at scale — flagged | Yes, with graph DB migration | **KEEP — with honest ceiling disclosed** |
| PREDICT zone risk + SHAP | Yes (shift planning) | Yes | Yes | Yes | Yes | Yes | Yes | Yes | **KEEP** |
| Bilingual Kannada voice | Would be used, but not provably buildable well in-window | Unclear — unproven | Real but not core | Marginal without proven tooling | Risky live | No — unproven skill | Yes, eventually | Yes | **PHASE 2, not MVP** |
| Individual behavioral profiling | No — ethically avoided by design | No — bias risk outweighs gain | Contested | No — invites distrust | Actively risky | Yes technically | No — governance risk | No | **CUT** |
| Full streaming (Kafka) | No | Marginal at this scale | No | No | No | No — real debugging risk | Eventually | Maybe | **CUT for MVP, roadmap item** |

---

## 5. THE DEMO MOMENT (this is the slide judges remember)

```text
Investigator types a real question live on stage
      │
      ▼
Advisor agent answer appears — fast, confident
      │
      ▼
Critic agent visibly flags one unsupported line
      │
      ▼
Answer self-corrects on screen, citation added
      │
      ▼
"Show me where" → SEE map pans to the exact hotspot
      │
      ▼
"Why is this zone risky" → PREDICT panel opens with SHAP reasons
      │
      ▼
One question. Three faces. One shared truth. Fully audited.
```

This sequence — ask, get caught making a small mistake, watch it self-correct, then jump seamlessly into the map and the prediction — is the entire pitch in 45 seconds. It also directly demonstrates the audit trail requirement from PS1 without narrating it.

---

## 6. DATA STRATEGY (stated openly, not hidden)

No team has real KSP data. Pretending otherwise on stage is the fastest way to lose judge trust the moment it's questioned.

- **Structure realism:** entity schema (Case, Person-ref, Location, Incident, Officer, Station) modeled on NCRB's publicly documented crime-record schema and India's standard FIR structure
- **Statistical realism:** category distributions, time-of-day patterns, and district-level volume calibrated against NCRB's published aggregate crime statistics — same discipline as RupeeIQ's `CATEGORY_BLUEPRINT` generator, just pointed at crime data
- **Entity realism:** all names, addresses, and case numbers are fully synthetic — generated, never scraped or invented to look real
- **On-stage framing:** "This runs on a synthetic dataset calibrated to NCRB's published statistics, structured to plug directly into KSP's live schema on adoption" — this is a strength to say out loud, not a disclaimer to bury

---

## 7. ENGINEERING SPEC (only where justified — nothing decorative)

### Frontend
React (not Streamlit — this product needs WebSocket-driven live updates that Streamlit fights against, per the DRISHTI feasibility note from earlier review). Three-face single-page app: ASK / SEE / PREDICT as tabs sharing one session and one query context.

### Backend
FastAPI. Modular: `auth/`, `ask/` (agent orchestration), `see/` (aggregation + graph), `predict/` (model serving), `audit/` (append-only log writer). REST APIs + one WebSocket channel for live SEE updates.

### Database
Single Postgres instance. `pgvector` extension for embeddings (no separate vector DB). `TimescaleDB` extension for the incident time-series feeding anomaly detection (no separate time-series DB). Redis for session cache only.

### AI / ML — five components, each with one job

| Model | Purpose | Feeds |
|---|---|---|
| Intent + NER classifier | Turn free text into structured query | ASK |
| Retrieval + Advisor generation | Draft grounded answer | ASK |
| Critic pass | Catch unsupported claims before the user sees them | ASK |
| Zone-time risk scorer (GBM) + SHAP | Explainable risk score per zone/window | PREDICT |
| Anomaly detector (seasonal decomposition + z-score) | Flag stations deviating from their own baseline | SEE |

Entity resolution (duplicate/serial-case detection) reuses the same embeddings already computed for ASK's retrieval — no sixth model, just a second use of an existing one. This is the kind of reuse a real engineering review rewards.

### Data Engineering
Batch ETL (synthetic generator → Postgres) on a schedule, not streaming. Data validation step (schema + range checks) before load — same discipline as your preprocessing pipelines' leakage-prevention habits.

### Security
JWT auth, 3-role RBAC (`Investigator` — ASK + SEE read, no PREDICT config; `Analyst` — full read + PREDICT tuning; `Admin` — user management + audit export). Every ASK query, every SEE drilldown, every PREDICT view writes to an append-only audit table. This audit table *is* the "explainable AI with audit trails" requirement — not a separate feature, the same log that already exists for RBAC compliance.

### Infrastructure
Docker Compose — one file, four services (frontend, backend, postgres, redis). Deployed to Render (proven pattern from Lexis) or Fly.io as a stretch. CI: a single GitHub Actions lint+test step is realistic in-window; full CI/CD pipeline is named as roadmap, not faked.

### DevOps / Testing
Smoke tests on the three core flows (ask→answer, map load, predict load) before demo. No claim of a full test suite — claiming one you don't have is worse than not having one.

---

## 8. TEAM SPLIT (adjust to your actual hackathon roster)

| Track | Owns | Depends on your TrackBot-proven pattern of |
|---|---|---|
| AI/ML core (you) | Intent/NER, retrieval+advisor+critic, risk model, SHAP | ARC's multi-agent design, every SHAP brief |
| Backend/data | FastAPI, Postgres schema, synthetic data pipeline | Modular file-per-concern structure from every ROCKET brief |
| Frontend/dashboard | React three-face UI, live map, WebSocket wiring | TrackBot dashboard's <50ms WebSocket pattern |
| Infra/demo | Docker Compose, deploy, demo script rehearsal | Lexis's deployment pivot discipline |

---

## 9. HONEST SCALABILITY CEILING (say this before a judge asks it)

- NetworkX link analysis is in-process and single-node — fine for a demo dataset, will need migration to a real graph database (Neo4j or Amazon Neptune) past roughly tens of thousands of case nodes. This is a named Phase 2 item, not a hidden weakness.
- Postgres + pgvector scales comfortably to KSP's actual station count for the MVP's query patterns; a dedicated vector store becomes worth the operational cost only past a much larger embedding corpus than a pilot deployment would generate.
- Kannada NLP and voice input are real requirements for genuine statewide adoption — explicitly scoped as the first post-hackathon milestone, with `IndicTrans2`/Whisper named as the evaluated path, not assumed to work.

---

## 10. WHY THIS PASSES THE "DOESN'T FEEL LIKE A HACKATHON PROJECT" BAR

It has one coherent data model instead of three disconnected demos. It names its own limitations before a judge finds them. It solves the audit-trail requirement through architecture, not a bolted-on log screen. Its riskiest technical component (the critic agent) is turned into the centerpiece of the demo instead of hidden as a safety net. And every cut feature — voice, individual profiling, streaming, graph DB — was cut for a stated, defensible reason, which is itself evidence of engineering judgment a judge can see.

That last point is the actual differentiator: most hackathon teams win or lose on what they built. This one also shows what it deliberately didn't build, and why.
