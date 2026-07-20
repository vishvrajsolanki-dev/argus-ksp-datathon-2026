# ARGUS Design System — Phase 7 Gate 4

**Status:** Locked recommendations adopted for implementation.

## Principles
1. No cards in hero. Cards only when they contain interaction.
2. One job per section.
3. Critic correction is a first-class component, never a toast.
4. Density over decoration in app chrome; atmosphere on landing only.
5. Radius 4–12px; single soft shadow; no glow; no pill clusters.

## Component decisions (recommended concept → ship)

| Component | Concepts considered | Adopted |
|-----------|---------------------|---------|
| Buttons | Filled / Ghost / Soft | Filled primary (ink), ghost secondary, amber only for “Review correction” |
| Cards | Bordered / Elevated / Flat | Flat bordered (`1px border`, no shadow) in app; elevated sparingly on landing feature rows |
| Tables | Dense / Comfortable | Dense with sticky header |
| Charts | Minimal ink / Colored | Minimal ink + amber highlight for top SHAP feature |
| Sidebar | Icon-rail / Labeled / Collapsible | Collapsible labeled sidebar (ink bg) |
| Nav top | Minimal / Utility-heavy | Minimal: search, notifications, avatar |
| Dialogs | Center modal / Drawer | Center for confirm; right drawer for record detail |
| Dropdowns | Native / Custom | Custom accessible listbox |
| Forms / Inputs | Underline / Boxed | Boxed 40px height, clear focus ring amber |
| Date picker | Inline / Popover | Popover |
| Upload | Dropzone / Button | Dropzone for CSV/import (1B) |
| Tabs | Underline / Segmented | Underline for ASK/SEE/PREDICT faces |
| Badges | Soft / Solid | Soft tint badges |
| Alerts | Banner / Inline | Inline for form; banner for anomaly |
| Toast | Bottom / Top-right | Top-right, 4s, not for critic |
| Modals | Same as dialogs | |
| Loaders | Spinner / Skeleton | Skeleton for panels; spinner for ASK send |
| Empty states | Illustration / Text | Text + single CTA |
| Animations | None / Subtle | 2–3 motions: tab crossfade 150ms, critic reveal expand, map fade-in |
| Icons | Lucide / Custom | Lucide, 18–20px, 1.5 stroke |
| Spacing | 4-pt grid | 4/8/12/16/24/32/48 |
| Cursor | Default | Pointer on controls; progress on ASK pending |

## CriticCorrection (flagship)
Layout: three stacked bands —
1. Original claim (struck / muted)
2. Flag reason (amber border-left)
3. Corrected claim (success tint)

Must be fully visible (not collapsed) when `correction.triggered === true`.
