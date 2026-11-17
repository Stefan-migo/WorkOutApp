'use client'

interface ExerciseDeleteDialogProps {
  onClose: () => void
  workoutRefCount: number
  onDelete: () => void
  dialogRef: React.RefObject<HTMLDialogElement | null>
  exerciseName: string
  deleting?: boolean
  error?: string | null
}

export function ExerciseDeleteDialog({
  onClose,
  workoutRefCount,
  onDelete,
  dialogRef,
  exerciseName,
  deleting,
  error,
}: ExerciseDeleteDialogProps) {
  return (
    <dialog
      ref={dialogRef}
      className="rounded-xl bg-surface border border-border/50 text-fg-2 p-24 max-w-sm w-full m-auto backdrop:bg-surface/80"
      onClose={onClose}
      onCancel={(event) => { if (deleting) event.preventDefault() }}
    >
      <div className="flex flex-col gap-4">
        <h3 className="font-headline text-headline-md font-semibold text-accent">Delete {exerciseName}?</h3>
        {workoutRefCount > 0 ? (
          <p className="font-body text-body-md text-accent">
            This exercise is used in {workoutRefCount} workout
            {workoutRefCount !== 1 && 's'}. Deleting it will not remove existing
            references, but the exercise name will no longer be shown.
          </p>
        ) : (
          <p className="font-body text-body-md text-muted">
            This exercise is not referenced by any workout. Are you sure?
          </p>
        )}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-lg font-label text-label-caps text-muted hover:text-accent transition-colors focus-visible:focus-ring"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-lg font-label text-label-caps bg-danger text-accent-on hover:bg-danger/15 hover:text-danger transition-colors focus-visible:focus-ring"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
