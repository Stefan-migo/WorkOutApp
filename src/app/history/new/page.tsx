'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui'
import { PageHeading } from '@/components/ui/PageHeading'
import { useSessions } from '@/hooks/useSessions'
import type { CompletedInterval } from '@/types/workout'

interface ExerciseEntry {
  key: number
  name: string
  amount: string
  unit: 'reps' | 'seconds'
}

const field = 'min-h-11 min-w-0 w-full rounded-control border border-border bg-surface px-3 text-base text-fg-2 focus-visible:focus-ring'

export default function NewTrainingEntryPage() {
  const router = useRouter()
  const { addSession, error } = useSessions()
  const [entries, setEntries] = useState<ExerciseEntry[]>([{ key: 0, name: '', amount: '', unit: 'reps' }])
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [validationError, setValidationError] = useState('')
  const nextKey = useRef(1)
  const submitting = useRef(false)
  const sessionId = useRef<string | null>(null)

  function updateEntry(key: number, updates: Partial<Omit<ExerciseEntry, 'key'>>) {
    setEntries((items) => items.map((item) => item.key === key ? { ...item, ...updates } : item))
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    setValidationError('')

    const startedAt = date ? new Date(date).getTime() : Date.now()
    if (!Number.isFinite(startedAt) || startedAt > Date.now()) {
      setValidationError('Choose a valid date and time in the past.')
      return
    }

    const intervals: CompletedInterval[] = []
    for (const entry of entries) {
      const name = entry.name.trim()
      const amount = Number(entry.amount)
      if (!name || !Number.isSafeInteger(amount) || amount < 1) {
        setValidationError('Enter an exercise and a whole number greater than zero for each entry.')
        return
      }
      intervals.push({
        intervalId: crypto.randomUUID(),
        title: name,
        type: 'work',
        plannedDuration: 0,
        actualDuration: entry.unit === 'seconds' ? amount : 0,
        actualReps: entry.unit === 'reps' ? amount : undefined,
        completed: true,
      })
    }

    submitting.current = true
    setSaving(true)
    const id = sessionId.current ??= crypto.randomUUID()
    try {
      const saved = await addSession({
        id,
        type: 'free',
        title: title.trim() || 'Free training',
        startedAt,
        completedAt: startedAt,
        intervals,
      })
      if (saved) router.replace(`/history/${id}`)
      else {
        submitting.current = false
        setSaving(false)
      }
    } catch {
      submitting.current = false
      setSaving(false)
      setValidationError('Could not save your training. Try again.')
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-16">
      <Link href="/history" className="w-fit text-sm font-semibold text-accent hover:underline">Back to training log</Link>
      <PageHeading title="Log free training" description="Record exercises you did outside a saved workout or sequence." />
      <form onSubmit={save} className="flex flex-col gap-16">
        <fieldset disabled={saving} className="flex min-w-0 flex-col gap-16">
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Session name (optional)
            <input className={field} value={title} maxLength={100} placeholder="Free training" onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold">
            Date and time (defaults to now)
            <input className={field} type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <div className="flex flex-col gap-8">
            <h2 className="text-lg font-semibold">Exercises</h2>
            {entries.map((entry, index) => (
              <fieldset key={entry.key} className="glass-card flex min-w-0 flex-col gap-8 rounded-card p-16">
                <legend className="sr-only">Exercise {index + 1}</legend>
                <label className="flex flex-col gap-2 text-sm font-semibold">
                  Exercise name
                  <input className={field} required maxLength={100} value={entry.name} placeholder="e.g. Push-ups" onChange={(event) => updateEntry(entry.key, { name: event.target.value })} />
                </label>
                <div className="grid min-w-0 grid-cols-2 gap-8">
                  <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold">
                    Amount
                    <input className={field} type="number" inputMode="numeric" min={1} max={99999} required value={entry.amount} onChange={(event) => updateEntry(entry.key, { amount: event.target.value })} />
                  </label>
                  <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold">
                    Unit
                    <select className={field} value={entry.unit} onChange={(event) => updateEntry(entry.key, { unit: event.target.value === 'seconds' ? 'seconds' : 'reps' })}>
                      <option value="reps">Reps</option>
                      <option value="seconds">Seconds</option>
                    </select>
                  </label>
                </div>
                {entries.length > 1 && (
                  <Button variant="ghost" className="self-start" aria-label={`Remove exercise ${index + 1}`} onClick={() => setEntries((items) => items.filter((item) => item.key !== entry.key))}>Remove</Button>
                )}
              </fieldset>
            ))}
            <Button variant="outline" className="self-start" onClick={() => {
              const key = nextKey.current++
              setEntries((items) => [...items, { key, name: '', amount: '', unit: 'reps' }])
            }}>Add exercise</Button>
          </div>
        </fieldset>
        {(validationError || error) && <p role="alert" className="text-sm text-danger">{validationError || 'Could not save your training. Try again.'}</p>}
        <Button type="submit" size="lg" disabled={saving}>{saving ? 'Saving…' : 'Save training'}</Button>
      </form>
    </div>
  )
}
