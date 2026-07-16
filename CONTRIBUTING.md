# Contributing to WorkOutApp

First off, thanks for taking the time to contribute! 🎉

## Code of Conduct

This project and everyone participating in it is governed by our
[Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected
to uphold this code.

## How to contribute

### Reporting bugs

Open a [bug report](https://github.com/[USER]/workoutapp/issues/new?labels=bug&template=bug_report.md)
with a clear description, steps to reproduce, and environment details.

### Suggesting features

Open a [feature request](https://github.com/[USER]/workoutapp/issues/new?labels=enhancement&template=feature_request.md).
Keep in mind WorkOutApp is **local-first** — features that require a server
backend need strong justification.

### Pull requests

1. Fork the repo and create your branch from `main`
2. If you're fixing a bug or adding a feature, open an issue first
3. Make your changes following the **SDD workflow** (see below)
4. Ensure all checks pass:
   - `npx tsc --noEmit` — zero errors
   - `npm test` — all tests pass
   - `npm run build` — builds successfully
5. Keep PRs **under 400 lines**. If your change is larger, discuss in the
   issue first — it may need to be split into stacked PRs
6. Open the PR with a clear title and description

## Development setup

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # vitest
npx tsc --noEmit
```

## SDD workflow

Every significant change follows **Spec-Driven Development**:

```
proposal → spec → design → tasks → apply → verify → archive
```

Each phase produces an artifact under `openspec/changes/<change-name>/`.
This ensures every change is deliberate, documented, and reviewed before
code is written.

## Coding standards

| Rule | Standard |
|------|----------|
| Language | TypeScript (strict mode) |
| Framework | Next.js 16+ (App Router) |
| Styling | Tailwind CSS v4 with Deep Nordic tokens |
| Components | Client components where needed, RSC where possible |
| Tests | Vitest + Testing Library |
| Commits | [Conventional commits](https://www.conventionalcommits.org/) |
| Philosophy | **Ponytail**: laziest correct solution, YAGNI, stdlib over deps |

## Testing philosophy

- **Strict TDD**: tests before or alongside code
- Every hook gets unit tests for its state machine / edge cases
- Every component gets render + interaction tests
- No 100% coverage target — test behavior, not implementation
- Manual E2E verification before release

No tests? No merge.
