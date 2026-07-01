import type { IntervalType } from '@/types/workout'

// ponytail: exhaustive maps so Tailwind v4 resolves all class strings

/** 10% opacity backgrounds (bg-segment-X/10) */
export const SEGMENT_BG: Record<IntervalType, string> = {
  prepare: 'bg-segment-prepare/10',
  work: 'bg-segment-work/10',
  rest: 'bg-segment-rest/10',
  cooldown: 'bg-segment-cooldown/10',
}

/** Left border colors (border-l-segment-*) */
export const SEGMENT_BORDER: Record<IntervalType, string> = {
  prepare: 'border-l-segment-prepare',
  work: 'border-l-segment-work',
  rest: 'border-l-segment-rest',
  cooldown: 'border-l-segment-cooldown',
}

/** Text colors (text-segment-*) */
export const SEGMENT_TEXT: Record<IntervalType, string> = {
  prepare: 'text-segment-prepare',
  work: 'text-segment-work',
  rest: 'text-segment-rest',
  cooldown: 'text-segment-cooldown',
}

/** 80% opacity backgrounds (bg-segment-X/80) */
export const SEGMENT_BG_80: Record<IntervalType, string> = {
  prepare: 'bg-segment-prepare/80',
  work: 'bg-segment-work/80',
  rest: 'bg-segment-rest/80',
  cooldown: 'bg-segment-cooldown/80',
}

/** Full-opacity dot/indicator colors (bg-segment-*) */
export const SEGMENT_DOT: Record<IntervalType, string> = {
  prepare: 'bg-segment-prepare',
  work: 'bg-segment-work',
  rest: 'bg-segment-rest',
  cooldown: 'bg-segment-cooldown',
}

/** Hex color values per interval type (used in TimerRing SVG stroke) */
export const SEGMENT_COLORS: Record<IntervalType, string> = {
  prepare: '#F59E0B',
  work: '#84cc16',
  rest: '#fb7185',
  cooldown: '#818cf8',
}

/** Material icon names per interval type */
export const TYPE_ICONS: Record<IntervalType, string> = {
  prepare: 'self_improvement',
  work: 'directions_run',
  rest: 'pause_circle',
  cooldown: 'ac_unit',
}
