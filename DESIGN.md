---
version: alpha
name: Morren-design-system
description: "Morren's dashboard design system, adapted from Kraken's clean crypto-exchange language for a B2B agri-commodity trading platform (cardamom RFQs, bids, live market prices, buyer/seller/admin/shipping consoles). White-canvas, near-black text, a single Kraken-purple accent, whisper-level shadows, and a restrained 8/10/12px radius scale. Built to read as a trustworthy trading terminal: calm, data-dense, numerically precise."
source: "Adapted from https://github.com/VoltAgent/awesome-design-md (design-md/kraken)"

colors:
  primary: "#7132f5"
  primary-hover: "#5741d8"
  primary-deep: "#5b1ecf"
  primary-subtle: "rgba(133,91,251,0.16)"
  on-primary: "#ffffff"
  ink: "#101114"
  ink-muted: "#686b82"
  ink-subtle: "#9497a9"
  canvas: "#f9f9fb"
  surface: "#ffffff"
  hairline: "#dedee5"
  success: "#149e61"
  success-text: "#026b3f"
  warning: "#d97706"
  danger: "#d92d20"
  info: "#2f6fed"
  dark-canvas: "#101114"
  dark-surface: "#17181c"
  dark-hairline: "#26272c"
  dark-primary: "#8a5cf6"

typography:
  page-title: { size: "24px", weight: 700, tracking: "-0.3px" }
  section-heading: { size: "18px", weight: 600, tracking: "normal" }
  card-title: { size: "15px", weight: 600, tracking: "normal" }
  body: { size: "14px", weight: 400, lineHeight: 1.5 }
  body-medium: { size: "14px", weight: 500 }
  numeric-lg: { size: "28px", weight: 700, tabularNums: true }
  caption: { size: "12px", weight: 500, color: "ink-subtle" }
  micro-label: { size: "11px", weight: 600, tracking: "0.04em", transform: "uppercase", color: "ink-subtle" }

## 1. Visual Theme & Atmosphere

Trading-terminal calm. White/near-black surfaces, one purple accent used deliberately (primary CTAs, active nav, focus rings, links) — never decoratively. Numeric data (prices, quantities, quote amounts) is the hero: set with tabular figures, bold weight, and semantic color only for directional meaning (green = favorable/rising, red = unfavorable/falling). Everything else stays neutral gray so the numbers pop.

## 2. Color Roles

- **Primary purple** (`#7132f5`): primary buttons, active nav/tab state, links, focus rings, chart series 1.
- **Near-black ink** (`#101114`): all primary text and headings — never pure black.
- **Cool gray** (`#686b82` / `#9497a9`): secondary text, placeholder text, disabled states.
- **Hairline** (`#dedee5`): all borders and dividers. One weight everywhere — no double borders.
- **Success green** (`#149e61`): awarded/accepted/paid/rising-price states. Badge bg at 16% opacity, text at full `#026b3f`.
- **Warning amber** (`#d97706`): pending/expiring/attention states.
- **Danger red** (`#d92d20`): rejected/failed/falling-price states.
- **Info blue** (`#2f6fed`): neutral informational states (in-transit, processing) — used sparingly, never competing with primary purple.

Role-color-coding across buyer/seller/admin/shipping dashboards is achieved with **icon chips and small role badges only** (see nav), not by re-theming each dashboard a different hue. The product must read as one system.

## 3. Component Rules

**Stat tiles**: icon in a 40px rounded-xl chip (`bg-{semantic}/10`, icon `text-{semantic}`), numeric value at `numeric-lg` weight 700, label below in `caption`. No card border flourish — just hairline + whisper shadow.

**Cards**: white surface, 1px hairline border, 12px radius, whisper shadow (`0 4px 24px rgba(0,0,0,0.03)`) instead of default shadcn shadow-sm. No shadow on hover unless interactive/clickable.

**Buttons**: 12px radius (button-scale, not the full 16px card radius). Primary = solid purple. Secondary = `bg-muted`. Outline = 1px hairline + purple text on hover. Never pill-shaped.

**Badges/status pills**: 8px radius, colored at 16% bg opacity with full-strength text color, never solid-fill except for the primary/default badge. Status vocabulary:
  - `success` → awarded, accepted, paid, delivered, price up
  - `warning` → pending, expiring soon, awaiting response
  - `destructive` → rejected, cancelled, failed, price down
  - `secondary`/`outline` → draft, closed, neutral/archived

**Tables**: hairline row dividers only (no vertical rules), row hover = `bg-muted/50`, numeric columns right-aligned with tabular figures, header row `caption` style (uppercase micro-label optional for dense tables).

**Empty states**: centered icon (muted, 48px) + one-line title + one-line body + single primary CTA. No decorative illustration.

## 4. Layout Principles

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40px — align to existing Tailwind spacing, don't invent arbitrary values.
- Radius scale: 8px (badges/inputs) · 10px (secondary buttons/small cards) · 12px (primary buttons/cards) — mirrors Tailwind's `rounded-sm/md/lg` once `--radius: 0.75rem`.
- Elevation: whisper (`0 4px 24px rgba(0,0,0,0.03)`) for resting cards, micro (`0 1px 4px rgba(16,24,40,0.04)`) for dropdowns/popovers. Never a heavy drop shadow.
- One accent color per screen. Don't let stat tiles and charts compete with five different hues — success/warning/destructive/info are semantic, not decorative.

## 5. Do's and Don'ts

**Do**
- Use purple only for actions and active/selected state.
- Use tabular-nums on every price, quantity, and quote figure.
- Keep hairline borders at one consistent color/weight across the whole app.

**Don't**
- Don't introduce new brand hues per dashboard role — use icon chips instead.
- Don't use pill buttons or radius beyond 12px on interactive controls.
- Don't stack a border AND a heavy shadow on the same card — pick hairline + whisper, not both loud.

## 6. Dark Mode

Canvas `#101114`, surface `#17181c`, hairline `#26272c`, primary brightens to `#8a5cf6` for AA contrast on dark. Same semantic roles, same radius/shadow rules (shadows barely visible on dark — lean on the hairline border for separation).
