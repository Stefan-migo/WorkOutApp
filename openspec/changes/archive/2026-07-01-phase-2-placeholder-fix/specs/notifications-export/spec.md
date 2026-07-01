# Delta for Notifications & Export

## MODIFIED Requirements

### Requirement: EX-1 — Export button on stats page

The system MUST render a button labeled "Export JSON" on the `/stats` page.

(Previously: label was "Export All Data". Implementation showed "Export CSV" — both were inaccurate. The function exports JSON, not CSV.)

#### Scenario: Export button visible on stats page

- GIVEN user visits `/stats`
- THEN a button labeled "Export JSON" is visible
- AND it is not disabled

#### Scenario: Click export triggers JSON download

- GIVEN user visits `/stats`
- WHEN user clicks "Export JSON"
- THEN a JSON file downloads containing all `workoutapp.*` localStorage keys
- AND the filename follows `workoutapp-export-{YYYY-MM-DD}.json`
