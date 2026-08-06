'use client'

import { useState, useRef, useEffect, type KeyboardEvent } from 'react'

interface TagChipsProps {
  tags: string[]
  onAdd: (tag: string) => void
  onRemove: (tag: string) => void
  suggestions: string[]
  placeholder?: string
  label?: string
}

export function TagChips({
  tags,
  onAdd,
  onRemove,
  suggestions,
  placeholder,
  label,
}: TagChipsProps) {
  const [input, setInput] = useState('')
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const filtered = input.trim()
    ? suggestions.filter(
        (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s),
      )
    : []

  // Reset focused index when filtered list changes
  useEffect(() => {
    setFocusedIdx(-1)
  }, [filtered.length])

  function addTag(tag: string) {
    if (tag.trim() && !tags.includes(tag.trim())) {
      onAdd(tag.trim())
    }
    setInput('')
    setFocusedIdx(-1)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (focusedIdx >= 0 && filtered[focusedIdx]) {
        addTag(filtered[focusedIdx])
      } else if (input.trim()) {
        addTag(input.trim())
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onRemove(tags[tags.length - 1]!)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx((prev) => (prev < filtered.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx((prev) => (prev > 0 ? prev - 1 : filtered.length - 1))
    } else if (e.key === 'Escape') {
      setFocusedIdx(-1)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="font-label text-label-caps text-muted">
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-1.5 p-2 bg-surface rounded-lg border border-border-soft focus-within:ring-2 focus-within:ring-secondary">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent rounded text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemove(tag)}
              className="text-accent/60 hover:text-accent transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded"
              aria-label={`Remove ${tag}`}
            >
              ✕
            </button>
          </span>
        ))}
        <div className="relative flex-1 min-w-[120px]">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent text-fg-2 font-body text-body-md placeholder:text-muted outline-none py-0.5"
          />
          {filtered.length > 0 && (
            <ul
              ref={listRef}
              className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border-soft rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto"
              role="listbox"
            >
              {filtered.map((suggestion, idx) => (
                <li
                  key={suggestion}
                  role="option"
                  aria-selected={idx === focusedIdx}
                  className={`px-3 py-1.5 cursor-pointer text-body-md text-fg-2 transition-colors ${
                    idx === focusedIdx
                      ? 'bg-accent/10 text-accent'
                      : 'hover:bg-surface-warm'
                  }`}
                  onMouseDown={(e) => {
                    // Use onMouseDown to fire before input blur
                    e.preventDefault()
                    addTag(suggestion)
                  }}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
