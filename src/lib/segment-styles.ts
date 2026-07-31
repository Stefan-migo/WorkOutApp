import type { IntervalType } from '@/types/workout'

// ponytail: exhaustive maps so Tailwind v4 resolves all class strings

/** 10% opacity backgrounds (bg-segment-X/10) */
export const SEGMENT_BG: Record<IntervalType, string> = {
  prepare: 'bg-segment-prepare/10',
  work: 'bg-segment-work/10',
  rest: 'bg-segment-rest/10',
  rest_between_cycles: 'bg-segment-rest/10',
  cooldown: 'bg-segment-cooldown/10',
}

/** Left border colors (border-l-segment-*) */
export const SEGMENT_BORDER: Record<IntervalType, string> = {
  prepare: 'border-l-segment-prepare',
  work: 'border-l-segment-work',
  rest: 'border-l-segment-rest',
  rest_between_cycles: 'border-l-segment-rest',
  cooldown: 'border-l-segment-cooldown',
}

/** Text colors (text-segment-*) */
export const SEGMENT_TEXT: Record<IntervalType, string> = {
  prepare: 'text-segment-prepare',
  work: 'text-segment-work',
  rest: 'text-segment-rest',
  rest_between_cycles: 'text-segment-rest',
  cooldown: 'text-segment-cooldown',
}

/** 80% opacity backgrounds (bg-segment-X/80) */
export const SEGMENT_BG_80: Record<IntervalType, string> = {
  prepare: 'bg-segment-prepare/80',
  work: 'bg-segment-work/80',
  rest: 'bg-segment-rest/80',
  rest_between_cycles: 'bg-segment-rest/80',
  cooldown: 'bg-segment-cooldown/80',
}

/** Full-opacity dot/indicator colors (bg-segment-*) */
export const SEGMENT_DOT: Record<IntervalType, string> = {
  prepare: 'bg-segment-prepare',
  work: 'bg-segment-work',
  rest: 'bg-segment-rest',
  rest_between_cycles: 'bg-segment-rest',
  cooldown: 'bg-segment-cooldown',
}

/** Hex color values per interval type (used in TimerRing SVG stroke) — canonical @theme values */
export const SEGMENT_COLORS: Record<IntervalType, string> = {
  prepare: '#3b82f6',
  work: '#10b981',
  rest: '#ef4444',
  rest_between_cycles: '#ef4444',
  cooldown: '#8b5cf6',
}

/** Material icon names per interval type */
export const TYPE_ICONS: Record<IntervalType, string> = {
  prepare: 'self_improvement',
  work: 'directions_run',
  rest: 'pause_circle',
  rest_between_cycles: 'hourglass_bottom',
  cooldown: 'ac_unit',
}
