# Supabase Storage

## Description

Exercise image storage in Supabase Storage bucket `exercise-images`. Replaces IndexedDB as the primary image store. Supports upload (with file type and size validation), listing images by exercise, and deletion. Images are publicly accessible for MVP simplicity.

## Requirements

| ID | Description | Keyword |
|----|-------------|---------|
| SS-1 | Images SHALL be stored in Supabase Storage bucket named `exercise-images` | MUST |
| SS-2 | `uploadImage(exerciseId, file)` SHALL upload the File and return the public Storage URL | MUST |
| SS-3 | `listImages(exerciseId)` SHALL return all Storage paths/URLs for a given exercise | MUST |
| SS-4 | `deleteImage(storagePath)` SHALL remove the file from Storage | MUST |
| SS-5 | Uploaded image URLs SHALL be appended to `exercises.images[]` for the exercise record | MUST |
| SS-6 | Storage operations SHALL return `{ data, isLoading, error }` state | MUST |
| SS-7 | The `exercise-images` bucket SHALL be public (no signed URLs for MVP) | SHOULD |
| SS-8 | File type validation SHALL accept only `image/*` MIME types | MUST |
| SS-9 | Upload size SHALL be capped at 10 MB per file | MUST |

## Scenarios

### Scenario: Upload image and view in exercise detail
- GIVEN user is authenticated and viewing an exercise
- WHEN user uploads a `.jpg` image file
- THEN the file is saved to `exercise-images` bucket
- AND the resulting URL is appended to `exercises.images[]`
- AND the image renders on the exercise detail page

### Scenario: Non-image file rejected
- GIVEN user on exercise detail page
- WHEN user tries to upload a `.pdf` file
- THEN upload is rejected with a file-type validation error
- AND no Storage operation is attempted

### Scenario: Delete image
- GIVEN an exercise with 2 uploaded images
- WHEN `deleteImage(path)` is called for the first image
- THEN the file is removed from Storage
- AND the URL is removed from `exercises.images[]`
- AND the second image remains accessible

### Scenario: Oversized file rejected
- GIVEN file size exceeds 10 MB
- WHEN user tries to upload
- THEN upload is rejected with a size validation error

### Scenario: Unauthenticated upload rejected
- GIVEN no valid Supabase session
- WHEN an upload is attempted
- THEN Supabase Storage returns a 401/403 error
- AND the error is surfaced in the UI

## Dependencies

- `user-auth` — authentication required for Storage upload/delete
- `supabase-data-layer` — `exercises.images[]` column stores the Storage URLs

## Out of Scope

- Image resizing or thumbnail generation
- CDN or cache optimization
- Private / signed URLs
- Image moderation or content review
- Backup or replication
