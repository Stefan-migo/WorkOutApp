'use client'

import { useState } from 'react'
import type { ProgramTemplate, WeekPlan } from '@/types/workout'

interface TemplatesPanelProps {
  templates: ProgramTemplate[]
  weekPlan: WeekPlan
  saveTemplate: (template: ProgramTemplate) => void
  saveWeekPlan: (plan: WeekPlan) => void
  deleteTemplate: (id: string) => void
}

export function TemplatesPanel({
  templates,
  weekPlan,
  saveTemplate,
  saveWeekPlan,
  deleteTemplate,
}: TemplatesPanelProps) {
  const [templateName, setTemplateName] = useState('')
  const [saveError, setSaveError] = useState('')

  function handleSaveTemplate() {
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
    <div className="glass-card rounded-lg p-16 flex flex-col gap-16">
      <h2 className="font-label-caps text-label-caps text-accent tracking-wider">
        Templates
      </h2>
      <div className="flex flex-col gap-8">
        <input
          type="text"
          placeholder="Template name\u2026"
          value={templateName}
          onChange={(e) => {
            setTemplateName(e.target.value)
            setSaveError('')
          }}
          className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant/50 text-body-md text-sm focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
        />
        {saveError && (
          <p className="text-label-caps text-error">{saveError}</p>
        )}
        <button
          onClick={handleSaveTemplate}
          disabled={!templateName.trim()}
          className="w-full px-3 py-2 rounded-lg bg-accent text-accent-on font-label-caps text-label-caps hover:bg-accent/90 disabled:opacity-40 transition-colors ambient-shadow"
        >
          Save current week
        </button>
      </div>
      <div className="flex flex-col gap-8 max-h-48 overflow-y-auto no-scrollbar">
        {templates.length === 0 && (
          <p className="text-body-md text-sm text-muted">
            No templates saved yet.
          </p>
        )}
        {templates.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between p-8 rounded-lg bg-surface border border-outline-variant/20"
          >
            <span className="text-body-md text-sm font-medium truncate text-fg-2">
              {t.title}
            </span>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => handleApplyTemplate(t)}
                className="px-2 py-1 rounded bg-accent text-accent-on font-label-caps text-[10px] hover:bg-accent-hover transition-colors"
              >
                Apply
              </button>
              <button
                onClick={() => deleteTemplate(t.id)}
                className="px-2 py-1 rounded bg-error-container text-on-error-container font-label-caps text-[10px] hover:bg-error hover:text-on-error transition-colors"
              >
                Del
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
