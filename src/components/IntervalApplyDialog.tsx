'use client'

import { useId } from 'react'
import { useIntervalDialog } from '@/hooks/useIntervalDialog'
import { TYPE_LABELS } from '@/lib/segment-styles'
import type { IntervalType } from '@/types/workout'
import styles from './IntervalDialog.module.css'

const FIELD_LABELS = {
  title: 'Title',
  duration: 'Duration',
  description: 'Instructions',
  imageUrl: 'Image',
  exerciseId: 'Exercise',
  mode: 'Tracking method',
  reps: 'Reps',
  weight: 'Weight',
}

export type EditField = keyof typeof FIELD_LABELS
export const EDIT_FIELDS = Object.keys(FIELD_LABELS) as EditField[]

export function IntervalApplyDialog({ type, changedFields, allCount, matchingCount, onApplyOne, onApplyMatching, onApplyAll }: {
  type: IntervalType
  changedFields: EditField[]
  allCount: number
  matchingCount: number
  onApplyOne: () => void
  onApplyMatching?: () => void
  onApplyAll: () => void
}) {
  const dialogRef = useIntervalDialog()
  const headingId = useId()
  const options = [
    { title: 'Just this block', description: 'Update the block you edited.', apply: onApplyOne },
    ...(onApplyMatching ? [{
      title: 'Same Work position across cycles',
      description: `Update ${matchingCount} blocks, including this one, in the same position within their cycles.`,
      apply: onApplyMatching,
    }] : []),
    { title: `All ${TYPE_LABELS[type].toLowerCase()} blocks`, description: `Update all ${allCount} blocks of this type.`, apply: onApplyAll },
  ]

  return (
    <dialog ref={dialogRef} className={styles.sheet} aria-labelledby={headingId} onCancel={onApplyOne}>
      <div className={styles.content}>
        <header className={styles.heading}>
          <h2 id={headingId} className="text-xl font-semibold">Where should these changes apply?</h2>
          <p className="mt-xs text-sm text-muted">{changedFields.map((field) => FIELD_LABELS[field]).join(', ')}</p>
        </header>
        <div className="grid gap-8 pb-16">
          {options.map(({ title, description, apply }, index) => (
            <button
              key={title}
              type="button"
              autoFocus={index === 0}
              onClick={apply}
              aria-label={title}
              className="rounded-xl border border-border-soft p-16 text-left hover:bg-surface-warm focus-visible:focus-ring"
            >
              <span className="block font-semibold text-fg-2">{title}</span>
              <span className="mt-xs block text-sm text-muted">{description}</span>
            </button>
          ))}
        </div>
      </div>
    </dialog>
  )
}
