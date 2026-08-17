'use client'

import { useState } from 'react'
import { formatWeekRange } from '@/lib/calendar-utils'
import type { ProgramTemplate, WeekPlan } from '@/types/workout'

interface CalendarHeaderProps {
  weekStart: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  templates: ProgramTemplate[]
  weekPlan: WeekPlan | undefined
  saveTemplate: (template: ProgramTemplate) => void
  saveWeekPlan: (plan: WeekPlan) => void
  deleteTemplate: (id: string) => void
}

// Unified header (CU-1): row 1 = week nav + Today; row 2 = template actions.
// On mobile the actions row collapses into a <details> (CU-2).
export function CalendarHeader({
  weekStart,
  onPrev,
  onNext,
  onToday,
  templates,
  weekPlan,
  saveTemplate,
  saveWeekPlan,
  deleteTemplate,
}: CalendarHeaderProps) {
  const [templateName, setTemplateName] = useState('')
  const [saveError, setSaveError] = useState('')

  function handleSaveTemplate() {
    if (!weekPlan) return
    const name = templateName.trim()
    if (!name) return
    // ponytail: naive duplicate check by title
    if (templates.some((t) => t.title.toLowerCase() === name.toLowerCase())) {
      setSaveError('A template with this title already exists.')
      return
    }
    const template: ProgramTemplate = {
      id: `template-${Date.now()}`,
      title: name,
      days: [...weekPlan.days],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    saveTemplate(template)
    setTemplateName('')
    setSaveError('')
  }

  function handleApplyTemplate(template: ProgramTemplate) {
    if (!weekPlan) return
    // ponytail: native confirm — no custom modal for one-off question
    if (
      !confirm(
        `Apply "${template.title}" to this week? This will overwrite all current day assignments.`,
      )
    )
      return
    const days = [...template.days] as typeof weekPlan.days
    saveWeekPlan({ ...weekPlan, days })
  }

  return (
    <header className="flex flex-col gap-16">
      {/* Row 1: week navigation + Today */}
      <div className="flex items-center justify-between gap-16 flex-wrap">
        <div className="flex items-center gap-16">
          <button
            onClick={onPrev}
            className="p-xs rounded-full hover:bg-surface-warm transition-colors"
            aria-label="Previous week"
          >
            <span className="material-symbols-outlined text-muted">chevron_left</span>
          </button>
          <h1 className="font-headline-md text-headline-md font-bold text-fg-2">
            {formatWeekRange(weekStart)}
          </h1>
          <button
            onClick={onNext}
            className="p-xs rounded-full hover:bg-surface-warm transition-colors"
            aria-label="Next week"
          >
            <span className="material-symbols-outlined text-muted">chevron_right</span>
          </button>
        </div>
        <button
          onClick={onToday}
          className="px-16 py-xs rounded-full border border-border-soft bg-surface text-fg-2 font-label-caps text-label-caps hover:border-accent hover:text-accent transition-colors"
        >
          Today
        </button>
      </div>

      {/* Row 2: template actions — collapsed on mobile (CU-2), always open on desktop */}
      <details className="group glass-card rounded-lg p-0 md:p-0">
        <summary className="md:hidden flex items-center gap-8 px-16 py-8 cursor-pointer font-label-caps text-label-caps text-muted">
          <span className="material-symbols-outlined text-sm">bookmark</span>
          Templates
        </summary>
        <div className="hidden group-open:flex md:flex flex-wrap items-center gap-8 px-16 py-12">
          <input
            type="text"
            placeholder="Template name…"
            value={templateName}
            onChange={(e) => {
              setTemplateName(e.target.value)
              setSaveError('')
            }}
            className="w-48 px-12 py-8 rounded-lg bg-surface border border-border/50 text-body-md text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
            aria-label="Template name"
          />
          <button
            onClick={handleSaveTemplate}
            disabled={!templateName.trim() || !weekPlan}
            className="px-16 py-8 rounded-lg bg-accent text-accent-on font-label-caps text-label-caps hover:bg-accent/90 disabled:opacity-40 transition-colors ambient-shadow"
          >
            Save as template
          </button>
          <label className="sr-only" htmlFor="template-apply">
            Apply template
          </label>
          <select
            id="template-apply"
            value=""
            onChange={(e) => {
              const t = templates.find((tpl) => tpl.id === e.target.value)
              if (t) handleApplyTemplate(t)
              e.target.value = ''
            }}
            disabled={templates.length === 0 || !weekPlan}
            className="px-12 py-8 rounded-lg bg-surface border border-border/50 text-body-md text-sm text-fg-2 disabled:opacity-40"
          >
            <option value="">Apply template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          {templates.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) deleteTemplate(e.target.value)
                e.target.value = ''
              }}
              aria-label="Delete template"
              className="px-12 py-8 rounded-lg bg-surface border border-border/50 text-body-md text-sm text-danger"
            >
              <option value="">Delete…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          )}
          {saveError && (
            <p className="text-label-caps text-danger basis-full">{saveError}</p>
          )}
        </div>
      </details>
    </header>
  )
}
