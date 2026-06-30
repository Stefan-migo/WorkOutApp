# WorkOutApp — Brand Spec (Burgundy Monochrome)

Design tokens extraídos del brief y codificados para el prototipo.
Variante: Burgundy monochrome — una familia wine-berry, del off-white rosado al burdeo profundo.

## Palette (OKLch)

| Token | Hex | OKLch | Usage |
|-------|-----|-------|-------|
| `--bg` | `#f7f3f1` | `oklch(95% 0.01 30)` | Page background — rose off-white |
| `--surface` | `#ffffff` | `oklch(100% 0 0)` | Cards, modals, raised surfaces |
| `--surface-alt` | `#f0eae8` | `oklch(92% 0.01 30)` | Secondary surface, hover states |
| `--fg` | `#1e1416` | `oklch(18% 0.02 20)` | Primary text — near-black cálido |
| `--fg-2` | `#4a3a3c` | `oklch(35% 0.02 20)` | Secondary headings, labels |
| `--muted` | `#8a7678` | `oklch(55% 0.02 20)` | Secondary text, captions |
| `--accent` | `#7a1a28` | `oklch(35% 0.12 25)` | Primary action, CTA, active states |
| `--accent-on` | `#ffffff` | — | Text on accent surfaces |
| `--border` | `#dccccc` | `oklch(80% 0.01 30)` | Hairlines, dividers normal |
| `--border-soft` | `#eae0de` | `oklch(88% 0.01 30)` | Soft borders, card outlines |
| `--primary` | `#7a1a28` | (same as accent) | Action color, Work intervals |
| `--success` | `#3a7050` | `oklch(45% 0.06 160)` | Work/active state — muted pine |
| `--warning` | `#8a7040` | `oklch(55% 0.06 80)` | Prepare intervals — muted amber |
| `--danger` | `#7a3840` | `oklch(40% 0.06 20)` | Rest intervals — muted rose |
| `--info` | `#5a4860` | `oklch(38% 0.04 290)` | CoolDown intervals — muted purple |

Interval colors (burgundy monochrome family):
| Token | Hex | Usage |
|-------|-----|-------|
| `--interval-prepare` | `#9a6a6e` | Prepare blocks — rose medio |
| `--interval-work` | `#7a1a28` | Work blocks — burdeo profundo |
| `--interval-rest` | `#b89a9a` | Rest blocks — rosado claro |
| `--interval-cooldown` | `#4a252a` | CoolDown — burdeo oscuro |

## Typography

- **Timer**: `'JetBrains Mono', 'SF Mono', ui-monospace, monospace` — huge countdown numbers
- **Display**: `system-ui, -apple-system, Segoe UI, Helvetica Neue, Arial, sans-serif` — headings, buttons (TWK Lausanne via fallback stack)
- **Body**: `system-ui, -apple-system, Segoe UI, Helvetica Neue, Arial, sans-serif` — body text (TWK Lausanne via fallback stack)

## Layout (Asana posture)

- **Radius**: 8px corner radius
- **Border weight**: 1px
- **Baseline grid**: 8px

## Theme

Warm, grounded, monochrome. No gradients, no emoji. Single accent (#7a1a28 burdeo) used at most twice per screen.

Dark mode default for timer; light mode optional.
