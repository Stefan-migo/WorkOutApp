'use client'

interface ExerciseDeleteDialogProps {
  onClose: () => void
  workoutRefCount: number
  onDelete: () => void
  dialogRef: React.RefObject<HTMLDialogElement | null>
}

export function ExerciseDeleteDialog({
  onClose,
  workoutRefCount,
  onDelete,
  dialogRef,
}: ExerciseDeleteDialogProps) {
  return (
    <dialog
      ref={dialogRef}
      className="rounded-xl bg-surface border border-outline-variant/50 text-on-surface p-24 max-w-sm w-full m-auto backdrop:bg-black/10"
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <h3 className="font-headline text-headline-md font-semibold text-primary">Delete Exercise?</h3>
        {workoutRefCount > 0 ? (
          <p className="font-body text-body-md text-secondary">
            This exercise is used in {workoutRefCount} workout
            {workoutRefCount !== 1 && 's'}. Deleting it will not remove existing
            references, but the exercise name will no longer be shown.
          </p>
        ) : (
          <p className="font-body text-body-md text-on-surface-variant">
            This exercise is not referenced by any workout. Are you sure?
          </p>
        )}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-label text-label-caps text-on-surface-variant hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2 rounded-lg font-label text-label-caps bg-error text-on-error hover:bg-error-container hover:text-on-error-container transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            Delete
          </button>
        </div>
      </div>
    </dialog>
  )
}
