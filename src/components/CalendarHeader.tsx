'use client'

import { useState } from 'react'
import { formatWeekRange } from '@/lib/calendar-utils'
import { Button } from '@/components/ui/Button'
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
    <header className="flex flex-col gap-2">
      {/* Row 1: week navigation + Today */}
      <div className="flex items-center justify-between gap-1 rounded-card bg-surface-warm px-2 py-1 sm:px-3">
        <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 sm:max-w-sm">
          <Button
            onClick={onPrev}
            variant="ghost"
            size="sm"
            pill
            className="active:scale-95 !transition-all duration-200"
            aria-label="Previous week"
          >
            <span className="material-symbols-outlined text-muted text-2xl">chevron_left</span>
          </Button>
          <h2 className="text-center text-sm font-semibold leading-tight text-fg-2 sm:text-lg">
            {formatWeekRange(weekStart)}
          </h2>
          <Button
            onClick={onNext}
            variant="ghost"
            size="sm"
            pill
            className="active:scale-95 !transition-all duration-200"
            aria-label="Next week"
          >
            <span className="material-symbols-outlined text-muted text-2xl">chevron_right</span>
          </Button>
        </div>
        <Button
          onClick={onToday}
          variant="outline"
          size="sm"
          pill
          className="shrink-0 bg-surface hover:border-accent hover:text-accent active:scale-95 !transition-all duration-200"
        >
          Today
        </Button>
      </div>

      <details className="glass-card rounded-card">
        <summary className="flex min-h-11 cursor-pointer items-center gap-8 rounded-card px-16 text-label-caps text-muted">
          <span className="material-symbols-outlined text-sm">bookmark</span>
          Week templates
          <span className="material-symbols-outlined ml-auto text-lg" aria-hidden="true">expand_more</span>
        </summary>
        <div className="flex flex-wrap items-center gap-8 border-t border-border-soft px-16 py-12">
          <input
            type="text"
            placeholder="Template name…"
            value={templateName}
            onChange={(e) => {
              setTemplateName(e.target.value)
              setSaveError('')
            }}
            className="w-48 px-12 py-8 rounded-card bg-surface border border-border/50 text-body-md text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
            aria-label="Template name"
          />
          <Button
            onClick={handleSaveTemplate}
            disabled={!templateName.trim() || !weekPlan}
            variant="primary"
            size="sm"
            elevated
          >
            Save as template
          </Button>
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
            className="px-12 py-8 rounded-card bg-surface border border-border/50 text-body-md text-sm text-fg-2 disabled:opacity-50"
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
              className="px-12 py-8 rounded-card bg-surface border border-border/50 text-body-md text-sm text-danger"
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
