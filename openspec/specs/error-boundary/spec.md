# Error Boundary

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| EB-1a | `ErrorBoundary` class component MUST be created at `src/components/ErrorBoundary.tsx` | MUST |
| EB-1b | `ErrorBoundary` MUST catch rendering errors and display a fallback UI with error message | MUST |
| EB-1c | `ErrorBoundary` MUST log errors to `console.error` for diagnostics | MUST |
| EB-1d | `src/app/layout.tsx` MUST wrap its children with `ErrorBoundary` | MUST |

## Scenarios

### Scenario: Component crash shows fallback
- GIVEN a component inside ErrorBoundary throws during render
- WHEN the error occurs
- THEN fallback UI renders with the error message instead of the crashed tree
- AND the error is logged via `console.error`

### Scenario: Normal render unaffected
- GIVEN all children render without errors
- WHEN the app renders
- THEN the normal children appear with no fallback
