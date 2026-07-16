# Exercise Favorites Specification

## Purpose

LocalStorage-based favorites system allowing users to bookmark exercises and filter the library by favorites.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| FV-1 | The `useFavorites()` hook SHALL persist favorites as a string array of exercise IDs under localStorage key `workoutapp.favorites` | MUST |
| FV-2 | `useFavorites()` SHALL return `{ favoriteIds: string[], toggleFavorite: (id: string) => void, isFavorite: (id: string) => boolean, favoriteExercises: Exercise[] }` where `favoriteExercises` is derived by mapping IDs against the exercises list | MUST |
| FV-3 | `toggleFavorite(id)` SHALL add the ID if absent, remove it if present — no duplicates | MUST |
| FV-4 | Each exercise card in the library list SHALL render a star toggle button (filled star when favorited, outline when not) | MUST |
| FV-5 | The exercise detail page (`/exercises/[id]`) SHALL render a star toggle button in the header area | MUST |
| FV-6 | The exercise library filter row SHALL include a "Favorites" tab (star icon) showing only favorited exercises when active | MUST |
| FV-7 | When the "Favorites" filter is active, favorited exercises SHALL appear sorted first; when no filter is active, favorites SHALL NOT change sort order | MUST |

## Scenarios

### Scenario: Toggle favorite from library card
- GIVEN an exercise card for "Push Up" in the library
- WHEN user clicks the star icon (outline state)
- THEN star fills to filled state AND `workoutapp.favorites` includes "Push Up"'s ID

### Scenario: Toggle favorite from detail page
- GIVEN user is viewing `/exercises/ex-1` (favorited state)
- WHEN user clicks the filled star in the header
- THEN star returns to outline AND ex-1 is removed from `workoutapp.favorites`

### Scenario: Favorites filter shows only favorited
- GIVEN 3 exercises of which 2 are favorited
- WHEN user clicks the "Favorites" filter tab
- THEN only the 2 favorited exercises appear in the grid

### Scenario: Persists across page reloads
- GIVEN exercise "Squat" is favorited
- WHEN user navigates away and back to `/exercises`
- THEN Squat's star is still filled

### Scenario: No favorites shows empty state
- GIVEN 10 exercises and 0 favorites
- WHEN user clicks the "Favorites" filter tab
- THEN empty state is shown with "No favorites yet — star exercises to add them" message

### Scenario: Exercise removed from library preserves ID in favorites
- GIVEN a favorited exercise that is later deleted from the library
- WHEN the user views the "Favorites" filter
- THEN empty state is shown (the ID remains in localStorage but is filtered from derived list)
