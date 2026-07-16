# Workout Creation Builder Specification

## Purpose

Screen 1 creation-only flow with a block palette for composing workouts. Cycle templates expand into flat intervals on save. Produces a flat `Interval[]` consumed by Screen 2 (Workout Editor).

## Requirements

### Requirement: CB-1 — Block palette

The system SHALL render a palette of 6 block types: Prepare, Work, Rest, Rest Between Cycles, Cycle, and Cool Down. Each SHALL display a type icon, label, and 2px top border accent in segment color.

#### Scenario: All block types visible
- GIVEN an empty builder
- WHEN the palette renders
- THEN all 6 types appear with icons and labels

### Requirement: CB-2 — Add interval block

Tapping a non-Cycle block SHALL append a single Interval of that type. Duration defaults: Work=30s, all other types=15s.

#### Scenario: Add Work interval
- GIVEN a builder with 2 intervals
- WHEN user taps "Work" in palette
- THEN a Work interval (30s) is appended at index 2

#### Scenario: Add Rest Between Cycles
- GIVEN an empty builder
- WHEN user taps "Rest Between Cycles"
- THEN a `rest_between_cycles` interval (15s) is appended

### Requirement: CB-3 — Cycle template

A Cycle template SHALL insert a transient `Cycle` object. The Cycle SHALL render as a grouped card with title input, repeat selector (x1–x10), workDuration and restDuration inputs, skipLastRest toggle (default on), and total duration badge. DnD SHALL move the Cycle as a single unit.

#### Scenario: Cycle renders with defaults
- GIVEN an empty builder
- WHEN user taps "Cycle" in palette
- THEN a Cycle card appears with repeat=x4, work=30s, rest=15s, skipLastRest=on

### Requirement: CB-4 — Cycle expansion on save

On save, the system SHALL expand each Cycle into flat Intervals: `repeat` × `[work(workDuration), rest(restDuration)]`, omitting the last rest if `skipLastRest=true`. The persisted workout SHALL contain only flat Intervals.

#### Scenario: Single cycle expands correctly
- GIVEN a builder with 1 Cycle (repeat=3, work=30s, rest=15s, skipLastRest=true)
- WHEN user saves
- THEN intervals are [Work(30s), Rest(15s), Work(30s), Rest(15s), Work(30s)]
- AND no Cycle objects exist in persisted data

#### Scenario: Mixed blocks and cycle
- GIVEN a builder with Prepare(15s), Cycle(repeat=2), CoolDown(15s)
- WHEN user saves
- THEN intervals are [Prepare, Work, Rest, Work, CoolDown]

#### Scenario: skipLastRest=false
- GIVEN a Cycle with repeat=2, skipLastRest=false
- WHEN user saves
- THEN intervals are [Work, Rest, Work, Rest]

### Requirement: CB-5 — DnD reorder

The builder SHALL support DnD reorder of all items. Cycles move as a single unit.

#### Scenario: Cycle moves as unit
- GIVEN Cycle, Work, CoolDown in builder
- WHEN user drags Cycle after CoolDown
- THEN order is Work, CoolDown, Cycle
