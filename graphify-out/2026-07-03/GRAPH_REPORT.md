# Graph Report - .  (2026-07-03)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 642 nodes · 1198 edges · 46 communities (25 shown, 21 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3cec0336`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Frontend Dashboard UI|Frontend Dashboard UI]]
- [[_COMMUNITY_Timer Play Flow|Timer Play Flow]]
- [[_COMMUNITY_Interval Workout Builder|Interval Workout Builder]]
- [[_COMMUNITY_Design & Contributing Docs|Design & Contributing Docs]]
- [[_COMMUNITY_Workout Editor Migration|Workout Editor Migration]]
- [[_COMMUNITY_Workout Editor Specs|Workout Editor Specs]]
- [[_COMMUNITY_Branch Consolidation Plans|Branch Consolidation Plans]]
- [[_COMMUNITY_Stats Dashboard|Stats Dashboard]]
- [[_COMMUNITY_Workout Day Planner|Workout Day Planner]]
- [[_COMMUNITY_Test & Calendar Specs|Test & Calendar Specs]]
- [[_COMMUNITY_Design System Assets|Design System Assets]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Description i18n|Description i18n]]
- [[_COMMUNITY_Title i18n|Title i18n]]
- [[_COMMUNITY_Exercise CRUD UI|Exercise CRUD UI]]
- [[_COMMUNITY_Open Design Metadata|Open Design Metadata]]
- [[_COMMUNITY_App Layout & Error|App Layout & Error]]
- [[_COMMUNITY_Architecture Audit|Architecture Audit]]
- [[_COMMUNITY_Test Mock Setup|Test Mock Setup]]
- [[_COMMUNITY_Agent Browser Prototype|Agent Browser Prototype]]
- [[_COMMUNITY_Product Vision|Product Vision]]
- [[_COMMUNITY_Ponytail Type Audit|Ponytail Type Audit]]
- [[_COMMUNITY_Author Metadata|Author Metadata]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Timer Ring Spec|Timer Ring Spec]]
- [[_COMMUNITY_Timer State Machine|Timer State Machine]]
- [[_COMMUNITY_Audit Fix Plan|Audit Fix Plan]]
- [[_COMMUNITY_Bug Report Template|Bug Report Template]]
- [[_COMMUNITY_Split Large Pages|Split Large Pages]]
- [[_COMMUNITY_CI Workflow|CI Workflow]]
- [[_COMMUNITY_Feature Request Template|Feature Request Template]]
- [[_COMMUNITY_OpenDesign Screens|OpenDesign Screens]]
- [[_COMMUNITY_PR Template|PR Template]]
- [[_COMMUNITY_File SVG Icon|File SVG Icon]]
- [[_COMMUNITY_Globe SVG Icon|Globe SVG Icon]]
- [[_COMMUNITY_Next SVG Icon|Next SVG Icon]]
- [[_COMMUNITY_Vercel SVG Icon|Vercel SVG Icon]]
- [[_COMMUNITY_Window SVG Icon|Window SVG Icon]]
- [[_COMMUNITY_PlayPage Tests|PlayPage Tests]]
- [[_COMMUNITY_useSequences Hook|useSequences Hook]]
- [[_COMMUNITY_useStats Hook|useStats Hook]]
- [[_COMMUNITY_useTimer Hook|useTimer Hook]]
- [[_COMMUNITY_Web Prototype Example|Web Prototype Example]]

## God Nodes (most connected - your core abstractions)
1. `React` - 51 edges
2. `useWorkoutContext()` - 28 edges
3. `Vitest` - 28 edges
4. `Workout` - 22 edges
5. `title_i18n` - 19 edges
6. `description_i18n` - 19 edges
7. `Interval` - 19 edges
8. `compilerOptions` - 19 edges
9. `Workout Editor Specification` - 17 edges
10. `useLocalStorage()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Exercise Picker Spec` --references--> `DayAssignmentModal component`  [INFERRED]
  openspec/changes/archive/2026-06-30-phase-3-exercise-library/specs/exercise-picker/spec.md → src/components/DayAssignmentModal.tsx
- `Architecture Hardening Spec` --references--> `Calendar page`  [INFERRED]
  openspec/changes/archive/2026-07-01-phase-3-architecture-hardening/spec.md → src/app/calendar/page.tsx
- `Architecture Hardening Spec` --references--> `Workouts list page`  [INFERRED]
  openspec/changes/archive/2026-07-01-phase-3-architecture-hardening/spec.md → src/app/workouts/page.tsx
- `Workout Editor Spec` --references--> `IntervalDetailSheet component`  [EXTRACTED]
  openspec/changes/archive/2026-07-01-phase-1-workout-pages/specs/workout-editor/spec.md → src/components/IntervalDetailSheet.tsx
- `Calendar Programming Spec` --references--> `useProgramTemplates hook`  [EXTRACTED]
  openspec/changes/archive/2026-06-30-phase-4-calendar-programming/specs/calendar-programming/spec.md → src/hooks/useProgramTemplates.ts

## Import Cycles
- None detected.

## Communities (46 total, 21 thin omitted)

### Community 0 - "Frontend Dashboard UI"
Cohesion: 0.07
Nodes (33): DashboardPage(), formatDate(), getGreeting(), CalendarPage(), DAY_NAMES, HeroCard(), HeroCardProps, MiniCalendarProps (+25 more)

### Community 1 - "Timer Play Flow"
Cohesion: 0.08
Nodes (30): Timer Play Flow Tests, ExercisePanel(), ExercisePanelProps, PlayHeader(), PlayHeaderProps, ProgressBar(), ProgressBarProps, TimerControls() (+22 more)

### Community 2 - "Interval Workout Builder"
Cohesion: 0.06
Nodes (37): Workout Model V2, IntervalDetailSheet(), IntervalDetailSheetProps, IntervalRow(), IntervalRowProps, TimelineStrip(), TimelineStripProps, BuilderItem (+29 more)

### Community 3 - "Design & Contributing Docs"
Cohesion: 0.04
Nodes (40): Glassmorphism, Nordic Athletic, SDD Workflow, Contributor Covenant, Next.js, Active Timer Design, Calendar Design, Dashboard Home Design (+32 more)

### Community 4 - "Workout Editor Migration"
Cohesion: 0.08
Nodes (42): TimerRingProps, isOldFormat(), migrateWorkout(), stripDeprecated(), uid(), Exercise Picker Spec, CycleTemplate, IntervalType (+34 more)

### Community 5 - "Workout Editor Specs"
Cohesion: 0.08
Nodes (32): Workout Cycle Editor, WE-23 Cycle grouping, Architecture Hardening Spec, Exercise Library Spec, Local Persistence Spec (Phase 3), Notifications & Export Spec, Statistics Spec, Workload Data Model Spec (+24 more)

### Community 6 - "Branch Consolidation Plans"
Cohesion: 0.07
Nodes (37): Branch Consolidation Proposal, Branch Consolidation Tasks, Sequence Builder - Nordic Athlete, Session Detail - Nordic Athlete, Workout Editor - Nordic Athlete, Workout History - Nordic Athlete, Workout List - WorkOutApp, OpenSpec Configuration (+29 more)

### Community 7 - "Stats Dashboard"
Cohesion: 0.08
Nodes (16): ConsistencyHeatmapProps, HeatmapCell, HeatmapCell, StatsDashboard(), StrainGauge(), StrainGaugeProps, VolumeChartProps, WeeklyVolume (+8 more)

### Community 8 - "Workout Day Planner"
Cohesion: 0.09
Nodes (30): DayAssignmentModalProps, DayRow(), DayRowProps, TodaysFocus(), TodaysFocusProps, UpcomingList(), UpcomingListProps, useWorkoutContext() (+22 more)

### Community 9 - "Test & Calendar Specs"
Cohesion: 0.15
Nodes (15): Phase 4 Test Migration, IE-1 flattenWorkout identity, Calendar Programming Spec, Interval Engine Spec, Test Migration Spec, Calendar page, DayAssignmentModal component, useProgramTemplates hook (+7 more)

### Community 10 - "Design System Assets"
Cohesion: 0.08
Nodes (24): assets, designSystem, skills, primary, od, capabilities, context, inputs (+16 more)

### Community 11 - "TypeScript Configuration"
Cohesion: 0.09
Nodes (22): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+14 more)

### Community 12 - "Description i18n"
Cohesion: 0.11
Nodes (19): description_i18n, ar, de, en, es, fr, id, it (+11 more)

### Community 13 - "Title i18n"
Cohesion: 0.11
Nodes (19): title_i18n, ar, de, en, es, fr, id, it (+11 more)

### Community 14 - "Exercise CRUD UI"
Cohesion: 0.14
Nodes (14): ExerciseDeleteDialog(), ExerciseDeleteDialogProps, CATEGORIES, DIFFICULTIES, ExerciseFormDialog(), ExerciseFormDialogProps, ExerciseSearchHeader(), ExerciseSearchHeaderProps (+6 more)

### Community 15 - "Open Design Metadata"
Cohesion: 0.17
Nodes (11): compat, agentSkills, description, homepage, license, name, $schema, specVersion (+3 more)

### Community 16 - "App Layout & Error"
Cohesion: 0.09
Nodes (9): inter, jetbrainsMono, metadata, viewport, ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, navItems (+1 more)

### Community 17 - "Architecture Audit"
Cohesion: 0.22
Nodes (9): Architecture Audit, Frontend-Backend Gap Audit, WorkoutContext, IntervalRow, StatsDashboard, TimerRing, useLocalStorage, useSessions (+1 more)

### Community 18 - "Test Mock Setup"
Cohesion: 0.25
Nodes (6): mockAddSession, mockGetExercise, mockGetWorkout, mockPush, mockTimer, mockWorkout

### Community 19 - "Agent Browser Prototype"
Cohesion: 0.33
Nodes (6): Agent Browser Skill, .atl/skill-registry.md, Web Prototype Checklist, Web Prototype Layouts, Web Prototype Skill, Web Prototype Template

### Community 20 - "Product Vision"
Cohesion: 0.50
Nodes (4): Local-first, Ponytail, Strict TDD, Product Vision

### Community 21 - "Ponytail Type Audit"
Cohesion: 0.67
Nodes (3): Ponytail Audit, Interval type, Sequence type

### Community 22 - "Author Metadata"
Cohesion: 0.67
Nodes (3): author, name, url

## Knowledge Gaps
- **237 isolated node(s):** `$schema`, `specVersion`, `name`, `title`, `zh-CN` (+232 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `React` connect `Frontend Dashboard UI` to `Timer Play Flow`, `Interval Workout Builder`, `Design & Contributing Docs`, `Workout Editor Migration`, `Stats Dashboard`, `Workout Day Planner`, `Exercise CRUD UI`, `App Layout & Error`, `Test Mock Setup`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `Vitest` connect `Timer Play Flow` to `Frontend Dashboard UI`, `Interval Workout Builder`, `Design & Contributing Docs`, `Workout Editor Migration`, `Stats Dashboard`, `Workout Day Planner`, `App Layout & Error`, `Test Mock Setup`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `Workout Cycle Editor` connect `Workout Editor Specs` to `Interval Workout Builder`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useWorkoutContext()` (e.g. with `NewSequencePage()` and `PlaySequencePage()`) actually correct?**
  _`useWorkoutContext()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `specVersion`, `name` to the rest of the system?**
  _237 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Dashboard UI` be split into smaller, more focused modules?**
  _Cohesion score 0.06821787414066631 - nodes in this community are weakly interconnected._
- **Should `Timer Play Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.0750151240169389 - nodes in this community are weakly interconnected._