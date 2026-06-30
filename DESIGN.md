---
name: Deep Nordic Athletic
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45474c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#ac3400'
  on-secondary: '#ffffff'
  secondary-container: '#fd6b36'
  on-secondary-container: '#5d1900'
  tertiary: '#111516'
  on-tertiary: '#ffffff'
  tertiary-container: '#26292b'
  on-tertiary-container: '#8d9092'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59d'
  on-secondary-fixed: '#390c00'
  on-secondary-fixed-variant: '#832600'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-timer:
    fontFamily: JetBrains Mono
    fontSize: 84px
    fontWeight: '700'
    lineHeight: 100px
    letterSpacing: -0.04em
  display-timer-mobile:
    fontFamily: JetBrains Mono
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 24px
  data-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
---

## Brand & Style
The brand personality is sophisticated, disciplined, and high-performance. It eschews the aggressive clichés of fitness apps in favor of a "Nordic Athletic" aesthetic—calm, focused, and premium. The target audience consists of serious athletes and professionals who value precision and a focused training environment.

The design style merges **Minimalism** with subtle **Glassmorphism**. High-end fitness is represented through spacious layouts, refined typography, and tactile surface treatments. The UI should evoke a sense of "quiet power," utilizing soft cream foundations punctuated by deep slate structural elements. Transitions should be fluid but purposeful, reflecting the rhythmic nature of interval training.

## Colors
The palette is rooted in the "Deep Nordic" concept. 

- **Primary (Deep Slate Blue):** Used for primary actions, headings, and core structural containers. It provides a grounded, stable feeling.
- **Accent (Terracotta):** Used sparingly for high-interest calls to action, active states, and motivational highlights.
- **Background (Cream):** The standard light-mode canvas, providing a softer, more sophisticated alternative to pure white.
- **Interval States:** 
    - **Sage Green:** Represents "Work" periods—energetic yet natural.
    - **Deep Coral:** Represents "Rest"—urgent enough to be noticed but distinct from "danger" in a traditional sense.
    - **Amber:** Preparation/Warm-up.
    - **Indigo:** Cooldown/Recovery.

**Active Timer Mode:** When a workout is in progress, the UI must pivot to a high-contrast dark theme (Background: #0F172A) to ensure maximum legibility of the JetBrains Mono numerals during intense movement.

## Typography
The typography system uses a functional pairing: **Inter** for all instructional and narrative UI elements to ensure a clean, modern feel, and **JetBrains Mono** for all performance data, timers, and metrics.

The monospaced nature of JetBrains Mono is critical for the "Active Timer" screens to prevent layout shifting as numbers change. Larger display sizes should utilize tighter letter spacing to maintain a "technical-chic" look. Use `label-caps` for section headers and metric descriptors to provide clear visual anchors.

## Layout & Spacing
The layout follows a strict **4px base grid** system. All margins, paddings, and component heights must be multiples of 4.

- **Mobile:** A single-column fluid layout with 20px side margins. Components like "Current Exercise" cards should occupy the full width of the safe area.
- **Desktop/Tablet:** A 12-column grid system. In the workout dashboard, use a 8-column main area for the primary timer and a 4-column sidebar for the upcoming interval list.
- **Spacing Rhythm:** Use `16px (md)` for internal card padding and `24px (lg)` for vertical separation between distinct UI sections.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Subtle Glassmorphism** rather than heavy shadows.

- **Surface Levels:** The base cream background is the lowest level. Cards and containers use a pure white surface with a very subtle 1px border (#E2E8F0) to define edges.
- **Active States:** The "current" interval card in a list should utilize a glassmorphism effect: a semi-transparent white background (80% opacity) with a 12px backdrop blur.
- **Shadows:** Use a single "Ambient Shadow" for elevated buttons—a soft, low-opacity Deep Slate tint (10% opacity, 20px blur, 4px Y-offset) to make them feel integrated rather than floating.

## Shapes
In line with the "High-End" positioning, this design system uses a **Rounded** shape language to feel approachable and ergonomic.

- **Cards & Primary Containers:** Use `rounded-lg` (16px) as the default to create a friendly, tactile appearance.
- **Buttons & Small Controls:** Use `rounded-md` (8px) to maintain a sense of precision and "tool-like" utility.
- **Progress Bars:** Use fully rounded (pill-shaped) caps to emphasize the fluid motion of time passing.

## Components

- **Buttons:** Primary buttons use the Deep Slate Blue (#1E293B) with white Inter-SemiBold text. Secondary buttons should be "Ghost" style with a 1px slate border.
- **Interval Cards:** Minimalist white cards with a 4px left-accent border color-coded by the interval state (e.g., Sage for Work). The name of the move is in Inter-Bold, and the duration is in JetBrains Mono.
- **The Timer:** The centerpiece of the app. It must be centered, utilizing `display-timer` typography. The progress ring surrounding the timer should use a thick stroke (12px) with a subtle "inner glow" of the active state color.
- **Chips:** Used for "Equipment Needed" or "Muscle Groups." Small, pills with a light Slate background (#F1F5F9) and Slate text.
- **Input Fields:** For setting interval times, use large-format inputs with JetBrains Mono text and no background—only a bottom-border that glows Terracotta on focus.
- **Exercise Previews:** Use high-quality, desaturated imagery or clean line-art animations contained within 16px rounded frames.