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

| Token                | Light     | Dark      |
| -------------------- | --------- | --------- |
| `background`         | `#ffffff` | `#0a1410` |
| `foreground`         | `#052e16` | `#ecfdf3` |
| `card`               | `#ffffff` | `#11201a` |
| `card-foreground`    | `#052e16` | `#ecfdf3` |
| `primary`            | `#16a34a` | `#4ade80` |
| `primary-foreground` | `#052e16` | `#052e16` |
| `secondary`          | `#f0fdf4` | `#16251e` |
| `muted`              | `#f1f5f3` | `#16251e` |
| `muted-foreground`   | `#4b5a53` | `#9fb3a9` |
| `accent`             | `#dcfce7` | `#1d3b2c` |
| `border`             | `#dfe5e2` | `#22362c` |
| `input`              | `#7d8d85` | `#637a6e` |
| `ring`               | `#16a34a` | `#4ade80` |
| `destructive`        | `#b91c1c` | `#f87171` |

### Two values that look wrong and are not

Copied from `ecolife-web`, where they were derived from contrast measurements. Do not "fix"
either one here.

- **`primary-foreground` is `eco-950`, not white.** White on `eco-600` is 3.30:1, which fails
  WCAG AA for button text. `eco-950` on `eco-600` is 4.52:1.
- **`input` is darker than `border`.** `border` is decorative — dividers and card edges.
  `input` is a control boundary and has to clear WCAG 2.2's 3:1 (3.49:1 light, 4.05:1 dark).
  Swapping them fails the control-boundary requirement.

> These values were reconciled on 31/10/2026. This repo and `ecolife-web` were scaffolded in
> parallel, so both independently wrote a semantic palette and 10 of 14 tokens disagreed.
> `ecolife-web/src/app/globals.css` is the authority — change a token there first, then copy.

## Where tokens cannot reach

Navigator options, `StatusBar` and SVG props take hex strings, not class names. Import
`colors` from `src/lib/theme.ts` for those — it reads the same JSON.

## Non-negotiables

- Touch targets ≥ 44 px (WCAG 2.2 AA).
- The tab bar sits inside the bottom safe-area inset.
- Colour is never the only signal — pair it with an icon or text.
