# TypeScript Configuration

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| TC-1a | `noUnusedLocals` MUST be `true` | MUST |
| TC-1b | `noUnusedParameters` MUST be `true` | MUST |
| TC-1c | `noUncheckedIndexedAccess` MUST be `true` | MUST |
| TC-1d | All TS compilation errors from these flags MUST be resolved | MUST |

## Scenarios

### Scenario: Flags enabled
- GIVEN `tsconfig.json`
- WHEN the file is read
- THEN `noUnusedLocals`, `noUnusedParameters`, and `noUncheckedIndexedAccess` are set to `true`

### Scenario: No compilation errors after fix
- GIVEN the three flags enabled
- WHEN `tsc --noEmit` runs
- THEN exit code is 0 (no errors)
