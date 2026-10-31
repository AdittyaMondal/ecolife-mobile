# Design tokens — ecolife-mobile

**Tokens are mirrored from `ecolife-web/DESIGN.md` — never redefine a token here, change it
there first.**

The web repo owns the palette (PRD-v2 §9.3). This repo copies it so the two apps cannot drift.
Every value lives in exactly one file, `design-tokens.json`, which both `tailwind.config.js`
and `src/lib/theme.ts` read.

## Changing a token

1. Change it in `ecolife-web/DESIGN.md` and its Tailwind theme.
2. Copy the new value into `design-tokens.json` here. Nothing else.

## The palette

`eco` is the primary scale. **Primary = `eco-600` (`#16a34a`).**

| Step      | Hex       |
| --------- | --------- |
| `eco-50`  | `#f0fdf4` |
| `eco-100` | `#dcfce7` |
| `eco-200` | `#bbf7d0` |
| `eco-300` | `#86efac` |
| `eco-400` | `#4ade80` |
| `eco-500` | `#22c55e` |
| `eco-600` | `#16a34a` |
| `eco-700` | `#15803d` |
| `eco-800` | `#166534` |
| `eco-900` | `#14532d` |
| `eco-950` | `#052e16` |

## Semantic names

Light is the default; the `dark:` variant uses the dark column.

| Token         | Light     | Dark      |
| ------------- | --------- | --------- |
| `background`  | `#ffffff` | `#052e16` |
| `foreground`  | `#14532d` | `#f0fdf4` |
| `card`        | `#ffffff` | `#14532d` |
| `primary`     | `#16a34a` | `#22c55e` |
| `muted`       | `#f0fdf4` | `#166534` |
| `border`      | `#dcfce7` | `#166534` |
| `destructive` | `#dc2626` | `#f87171` |

## Where tokens cannot reach

Navigator options, `StatusBar` and SVG props take hex strings, not class names. Import
`colors` from `src/lib/theme.ts` for those — it reads the same JSON.

## Non-negotiables

- Touch targets ≥ 44 px (WCAG 2.2 AA).
- The tab bar sits inside the bottom safe-area inset.
- Colour is never the only signal — pair it with an icon or text.
