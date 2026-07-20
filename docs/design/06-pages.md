# ARGUS Page-by-Page Redesign — Phase 7 Gate 6

**Status:** Locked layout recommendations for implementation.

## Landing
**Adopted hero:** Full-bleed cool gradient field (ink→steel, subtle grid) + large ARGUS wordmark + headline “One question. Three faces. One audited truth.” + dual CTA (Start pilot / Watch critic demo) + dominant product visual of critic correction — not an inset card collage.
Sections: Features (Ask/See/Predict), Interactive demo strip, Social proof (Datathon/KSP framing), Pricing, FAQ, Footer.
Motion: wordmark fade-up, critic band expand once, heatmap opacity in.

## Auth
Centered narrow form on atmospheric bg; no sidebar. Clear role hint after login.

## App — ASK (AI Chat)
Concepts considered: ChatGPT full-bleed / Claude dual-pane / Cursor compose / Perplexity citations rail / Linear AI minimal.
**Adopted:** Dual-pane — chat primary (60%) + citations/sources rail (40%) on desktop; stacked on mobile. CriticCorrection inline in assistant turn. Composer sticky bottom.

## App — SEE
Full-bleed map under thin filter bar (district, time window, refresh). Anomaly banner top. No floating promo chips on map.

## App — PREDICT
Zone selector + time window + risk score KPI (mono) + SHAP horizontal bars. Ethics note sticky: “Zone-time only — never person-level.”

## Dashboard home
Redirect to `/app/ask` (ASK is primary face). Optional Insights later.

## Reports / Insights / Cases
Dense tables + export. Filters left or top.

## Settings / Billing / Notifications / Admin / Help
Standard SaaS settings patterns; ink sidebar persists; content max-width 960px.

## Responsive
- Desktop ≥1200: sidebar + dual pane
- Tablet: collapsible sidebar, citations below chat
- Mobile: bottom face switcher (Ask/See/Predict), single column

## Interactions
- Cross-link: “Pin to SEE” on ASK answers; hotspot click opens ASK with zone context
- ASK send: optimistic user bubble + skeleton assistant
- Critic: 200ms expand animation when triggered
