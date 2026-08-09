'use client'

import { useRef, type ComponentPropsWithoutRef } from 'react'
import { Input } from './Input'

export interface SearchInputProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'onChange'> {
  /** Visible label — defaults to "Search" (UIP-4: never placeholder-only). */
  label?: string
  value: string
  onChange: (value: string) => void
  /** Called after the clear affordance fires onChange(''). */
  onClear?: () => void
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

export function SearchInput({
  label = 'Search',
  value,
  onChange,
  onClear,
  disabled,
  className = '',
  ...rest
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleClear() {
    onChange('')
    onClear?.()
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        leadingIcon={<SearchIcon />}
        // pr-12 keeps the value text clear of the 44px clear affordance.
        className={`pr-12 ${className}`.trim()}
        {...rest}
        type="search"
      />
      {value !== '' && !disabled && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={handleClear}
          // top-5 = label row (16px) + gap (4px): centers the 44px affordance
          // on the h-11 field (DD-2 maps; ≥44px touch target).
          className="absolute right-1 top-5 flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:text-fg-2 focus-visible:focus-ring"
        >
          <ClearIcon />
        </button>
      )}
    </div>
  )
}
