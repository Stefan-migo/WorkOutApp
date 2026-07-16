<div align="center">
  <h1>WorkOutApp</h1>
  <p><strong>Interval training timer & workout planner</strong></p>
  <p>
    <em>Local-first · PWA · No backend required</em>
  </p>

  <!-- TODO: add badges once published -->
  <!--
  [![CI](https://github.com/USER/workoutapp/actions/workflows/ci.yml/badge.svg)](https://github.com/USER/workoutapp/actions/workflows/ci.yml)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
  [![npm test](https://img.shields.io/badge/tests-196%20passing-brightgreen)](#)
  -->
</div>

---

## Features

- ⏱ **Interval timer** — prepare, work, rest, cooldown with audio beeps
- 🔄 **Cycles & sets** — nest intervals for HIIT, Tabata, circuit training
- 🏋️ **Exercise library** — catalog exercises with muscle groups, equipment, difficulty
- 📋 **Workout editor** — build workouts with drag-free reordering
- 🔗 **Sequence builder** — chain multiple workouts into a session
- 📅 **Weekly calendar** — plan your training week
- 📊 **Session history & stats** — track what you've done
- 🌙 **Dark mode** — automatic (prefers-color-scheme)
- 🔊 **Audio cues** — Web Audio API, zero audio files
- 🔔 **Browser notifications** — alerts when tab is hidden
- 📱 **PWA-ready** — install to home screen, work offline

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| State | React + localStorage |
| Tests | Vitest + Testing Library |
| Design | [Deep Nordic Athletic](DESIGN.md) |

**Zero runtime dependencies beyond React and Next.js.** The entire app runs
in the browser with no backend, no database, no API keys, and no account
required.

## Quick start

```bash
git clone https://github.com/[USER]/workoutapp.git
cd workoutapp
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start building workouts.

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm test` | Run Vitest test suite |
| `npm run build` | Production build |
| `npx tsc --noEmit` | TypeScript type check |

## Screenshots

<!-- TODO: add screenshots -->

## Philosophy

Built on **Ponytail** principles:

- **YAGNI** — if it's not needed now, it doesn't exist
- **Stdlib first** — the browser already has what we need
- **Shortest correct path** — one line beats fifty
- **No speculative abstractions** — no interfaces with one implementation

> "The best code is the code never written."

## Project structure

```
src/
├── app/          # Next.js App Router pages
│   ├── workouts/ # Workout CRUD + timer play page
│   ├── sequences/# Sequence builder and list
│   ├── calendar/ # Weekly planning
│   ├── exercises/# Exercise library
│   ├── history/  # Session history + detail
│   └── stats/    # Statistics dashboard
├── components/   # Shared UI components
├── hooks/        # Custom React hooks (data + logic)
├── lib/          # Pure utility functions
├── context/      # React context providers
└── types/        # TypeScript type definitions
```

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the current plan towards v1.0:

1. ✅ Open source foundation
2. ⏳ Sound, notifications & export improvements
3. ⏳ Remote database (Supabase)
4. ⏳ E2E tests (Playwright)
5. ⏳ v1.0 release

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

**TL;DR:** PRs under 400 lines, TDD required, conventional commits, no
speculative complexity.

## License

[MIT](LICENSE) © WorkOutApp contributors
