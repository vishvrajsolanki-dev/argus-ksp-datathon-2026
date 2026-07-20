# ARGUS Navigation & App Structure — Phase 7 Gate 5

**Status:** Locked.

## Concepts evaluated
1. **Three-tab only** (docs MVP) — too small for 1B SaaS
2. **Top mega-nav** — poor for ops density
3. **Icon rail + faces** — Linear-like
4. **Collapsible sidebar + face tabs** — **ADOPTED**
5. **Command palette only** — too advanced for pilot officers

## Information architecture

```
/                     Landing (marketing)
/pricing              Pricing
/login  /signup       Auth
/verify               Email verification
/onboarding           Org/station setup

/app                  Authenticated shell
  /app/ask            ASK (default home)
  /app/see            SEE heatmap
  /app/predict        PREDICT (Analyst+)
  /app/reports        Reports / exports
  /app/insights       Insights summary
  /app/transactions   Case/incident list (searchable)
  /app/notifications  Notification center
  /app/settings       Settings hub
    /profile
    /billing
    /organization
    /security
  /app/admin          Admin (Admin role)
    /users
    /audit
    /health
  /app/help           Help + Ethics/DPDP
```

## Shell layout
- Left sidebar (ink): ARGUS mark, primary faces (Ask/See/Predict), then secondary (Reports, Cases, Insights), footer (Settings, Help, theme)
- Top bar: contextual title, cross-link chips, notifications, user menu
- Main: face content; shared `CrossLinkContext`

## Role visibility
| Item | Investigator | Analyst | Admin |
|------|--------------|---------|-------|
| ASK | ✓ | ✓ | ✓ |
| SEE | ✓ | ✓ | ✓ |
| PREDICT | read-only later / hide MVP | ✓ | ✓ |
| Admin | ✗ | ✗ | ✓ |
| Billing | org admin | org admin | ✓ |
| Audit export | ✗ | ✗ | ✓ |
