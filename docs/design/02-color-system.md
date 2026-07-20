# ARGUS Color System — Phase 7 Gate 2

**Status:** Locked — Concept A “Command Precision” palette.

## Concepts evaluated
1. **Ink + Amber** (adopted) — navy primary, amber critic, cool gray surfaces
2. **Forest Civic** — green primary on warm paper (rejected: cream bias)
3. **Cyan Night** — black + cyan glow (rejected: dark-mode/glow cliché)
4. **Stripe Blue** — #635BFF-adjacent (rejected: purple-indigo cluster)
5. **Slate Mono** — grayscale + single red danger (rejected: too flat for charts)

## CSS variables (light)

```css
:root {
  --color-primary: #0B1F33;        /* Ink navy */
  --color-primary-hover: #16324C;
  --color-secondary: #3D5A73;      /* Steel */
  --color-accent: #C47B16;         /* Signal amber — critic / focus */
  --color-accent-soft: #F3E6D0;
  --color-bg: #F5F7FA;             /* Cool gray wash — not cream */
  --color-surface: #FFFFFF;
  --color-sidebar: #0B1F33;
  --color-navbar: #FFFFFF;
  --color-card: #FFFFFF;
  --color-border: #D7DEE7;
  --color-input-bg: #FFFFFF;
  --color-input-border: #B8C4D1;
  --color-text: #0B1F33;
  --color-text-muted: #5A6B7C;
  --color-hover: #E8EEF4;
  --color-success: #1F7A4D;
  --color-warning: #C47B16;
  --color-danger: #B42318;
  --color-info: #1B6B93;
  --color-chart-1: #0B1F33;
  --color-chart-2: #C47B16;
  --color-chart-3: #1F7A4D;
  --color-chart-4: #1B6B93;
  --color-chart-5: #8B5A2B;
  --color-heatmap-low: #D6E4F0;
  --color-heatmap-high: #B42318;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --shadow-sm: 0 1px 2px rgba(11, 31, 51, 0.06);
  --shadow-md: 0 4px 12px rgba(11, 31, 51, 0.08);
}
```

## CSS variables (dark)

```css
[data-theme="dark"] {
  --color-primary: #E8EEF4;
  --color-primary-hover: #FFFFFF;
  --color-secondary: #9BB0C3;
  --color-accent: #E0A04A;
  --color-accent-soft: #3A2E1A;
  --color-bg: #0A121B;
  --color-surface: #121C27;
  --color-sidebar: #070E14;
  --color-navbar: #121C27;
  --color-card: #121C27;
  --color-border: #243140;
  --color-input-bg: #0A121B;
  --color-input-border: #314456;
  --color-text: #E8EEF4;
  --color-text-muted: #8FA3B5;
  --color-hover: #1A2734;
  --color-success: #3D9B6E;
  --color-warning: #E0A04A;
  --color-danger: #F04438;
  --color-info: #4BA3C7;
}
```

## Usage rules
- Amber reserved for critic correction, warnings, focus rings — not primary CTAs.
- Primary CTA = ink navy fill, white text.
- Heatmap: cool blue → danger red (never purple).
- Default theme: **light** for SaaS daily use; dark available in Settings.
