import type { ExerciseFormData } from './ExerciseFormDialog'
import { TagChips } from './TagChips'

export const EXERCISE_FIELD = 'min-h-[44px] min-w-0 w-full rounded-lg border border-border-soft bg-surface px-3 py-2 text-base text-fg-2 placeholder:text-muted focus-visible:focus-ring'

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const
const FORCE_OPTIONS = ['push', 'pull', 'static'] as const
const MECHANIC_OPTIONS = ['compound', 'isolation'] as const

export function ExerciseFormDetails({ form, update, allMuscleGroups, allEquipment }: {
  form: ExerciseFormData
  update: (changes: Partial<ExerciseFormData>) => void
  allMuscleGroups: string[]
  allEquipment: string[]
}) {
  return (
    <details className="rounded-xl border border-border-soft bg-surface-warm">
      <summary className="cursor-pointer rounded-xl px-16 py-16 text-sm font-semibold text-fg-2 focus-visible:focus-ring">
        Instructions and exercise details <span className="font-normal text-muted">(optional)</span>
      </summary>
      <div className="grid gap-16 px-16 pb-16">
        {/* Description */}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-fg-2">Description</span>
          <textarea
            value={form.description ?? ''}
            onChange={(e) => update({ description: e.target.value })}
            rows={3}
            className={EXERCISE_FIELD}
            placeholder="Optional description"
          />
        </label>

        {/* Instructions — Step Editor */}
        <div data-testid="instructions-section" className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-fg-2">Step-by-step instructions</h3>
          {form.instructions.map((step, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-xs">
              <span className="text-muted font-body text-body-md w-5 shrink-0 text-right">
                {idx + 1}.
              </span>
              <input
                type="text"
                value={step}
                onChange={(e) => {
                  const next = [...form.instructions]
                  next[idx] = e.target.value
                  update({ instructions: next })
                }}
                aria-label={`Step ${idx + 1}`}
                className="min-w-[8rem] flex-1 border border-border-soft bg-surface text-fg-2 rounded-lg px-3 py-1.5 font-body text-body-md placeholder:text-muted outline-none focus:ring-2 focus:ring-accent"
                placeholder={`Step ${idx + 1} description`}
              />
              <button
                type="button"
                onClick={() => {
                  const next = [...form.instructions]
                  if (idx > 0) {
                    [next[idx - 1]!, next[idx]!] = [next[idx]!, next[idx - 1]!]
                    update({ instructions: next })
                  }
                }}
                disabled={idx === 0}
                className="grid size-[44px] shrink-0 place-items-center text-muted hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:focus-ring rounded"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = [...form.instructions]
                  if (idx < next.length - 1) {
                    [next[idx]!, next[idx + 1]!] = [next[idx + 1]!, next[idx]!]
                    update({ instructions: next })
                  }
                }}
                disabled={idx === form.instructions.length - 1}
                className="grid size-[44px] shrink-0 place-items-center text-muted hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:focus-ring rounded"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => {
                  update({ instructions: form.instructions.filter((_, i) => i !== idx) })
                }}
                className="grid size-[44px] shrink-0 place-items-center text-muted hover:text-danger transition-colors focus-visible:focus-ring rounded"
                aria-label={`Remove step ${idx + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => update({ instructions: [...form.instructions, ''] })}
            className="self-start min-h-[44px] px-8 rounded-lg font-label text-label-caps text-accent hover:bg-surface-warm transition-colors focus-visible:focus-ring"
          >
            + Add Step
          </button>
        </div>

        {/* Primary Muscles */}
        <TagChips
          tags={form.primaryMuscles}
          onAdd={(tag) => update({ primaryMuscles: [...form.primaryMuscles, tag] })}
          onRemove={(tag) => update({ primaryMuscles: form.primaryMuscles.filter((t) => t !== tag) })}
          suggestions={allMuscleGroups}
          placeholder="Type to search..."
          label="Primary Muscles"
        />

        {/* Secondary Muscles */}
        <TagChips
          tags={form.secondaryMuscles}
          onAdd={(tag) => update({ secondaryMuscles: [...form.secondaryMuscles, tag] })}
          onRemove={(tag) => update({ secondaryMuscles: form.secondaryMuscles.filter((t) => t !== tag) })}
          suggestions={allMuscleGroups}
          placeholder="Type to search..."
          label="Secondary Muscles"
        />

        {/* Equipment */}
        <TagChips
          tags={form.equipment}
          onAdd={(tag) => update({ equipment: [...form.equipment, tag] })}
          onRemove={(tag) => update({ equipment: form.equipment.filter((t) => t !== tag) })}
          suggestions={allEquipment}
          placeholder="Type to search..."
          label="Equipment"
        />

        <div className="grid gap-8 sm:grid-cols-3">
          <label className="grid min-w-0 gap-xs text-sm font-semibold">
            Difficulty
            <select
              value={form.difficulty ?? ''}
              onChange={(event) => update({ difficulty: (event.target.value || undefined) as ExerciseFormData['difficulty'] })}
              className={EXERCISE_FIELD}
            >
              <option value="">Not specified</option>
              {DIFFICULTIES.map((option) => <option key={option} value={option}>{option[0]!.toUpperCase() + option.slice(1)}</option>)}
            </select>
          </label>
          <label className="grid min-w-0 gap-xs text-sm font-semibold">
            Force
            <select
              value={form.force ?? ''}
              onChange={(event) => update({ force: (event.target.value || undefined) as ExerciseFormData['force'] })}
              className={EXERCISE_FIELD}
            >
              <option value="">Not specified</option>
              {FORCE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="grid min-w-0 gap-xs text-sm font-semibold">
            Mechanics
            <select
              value={form.mechanic ?? ''}
              onChange={(event) => update({ mechanic: (event.target.value || undefined) as ExerciseFormData['mechanic'] })}
              className={EXERCISE_FIELD}
            >
              <option value="">Not specified</option>
              {MECHANIC_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </div>
    </details>
  )
}
