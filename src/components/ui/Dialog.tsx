'use client'

// Controlled native <dialog> (DD-3/D9): open -> showModal(), !open -> close().
// Backdrop click (e.target === ref.current), native cancel (ESC) and close
// all funnel to onOpenChange(false). aria-labelledby via useId + explicit
// aria-modal. Focus in/restore is native showModal behavior — asserted in the
// browser a11y suite (2d.7), jsdom dialog support is partial.
import {
  useEffect,
  useId,
  useRef,
  type ComponentPropsWithoutRef,
  type MouseEvent as ReactMouseEvent,
  type SyntheticEvent,
} from 'react'

export interface DialogProps extends ComponentPropsWithoutRef<'dialog'> {
  /** Controlled open state — synced to the native dialog via the effect. */
  open: boolean
  /** Called with false on ESC/backdrop/close. */
  onOpenChange: (open: boolean) => void
  /** fixed centered modal (default) | sheet sliding from the right. */
  variant?: 'fixed' | 'sheet'
  /** Accessible name, wired via aria-labelledby (UIP-6c). */
  title: string
}

// Token-only class maps (D11): every class exists in the @theme (DD-2).
const FIXED =
  'fixed inset-0 z-50 w-full max-w-lg m-auto rounded-2xl bg-surface border border-border text-fg-2 p-24 shadow-fab backdrop:bg-surface/80'
const SHEET =
  'fixed inset-0 z-50 w-full h-full m-0 ml-auto max-w-md bg-surface text-fg-2 backdrop:bg-surface/80 translate-x-full transition-transform duration-300 open:translate-x-0 motion-reduce:translate-x-0 motion-reduce:transition-none'

export function Dialog({
  open,
  onOpenChange,
  variant = 'fixed',
  title,
  className = '',
  children,
  ...rest
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    // Guard against double-showModal (React 19 StrictMode double effects) —
    // showModal() on an already-open dialog throws InvalidStateError.
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    // Stop the native close so the controlled open state stays authoritative;
    // the parent flips open=false and the effect closes the dialog.
    event.preventDefault()
    onOpenChange(false)
  }

  const handleClose = () => {
    // Fired after close() completes (programmatic or cancel default) —
    // idempotent: onOpenChange(false) on an already-closed dialog is a no-op.
    onOpenChange(false)
  }

  const handleBackdrop = (event: ReactMouseEvent<HTMLDialogElement>) => {
    // Backdrop clicks surface on the dialog element itself (::backdrop);
    // clicks on content carry a child target (UIP-6a).
    if (event.target === dialogRef.current) onOpenChange(false)
  }

  const classes = [variant === 'fixed' ? FIXED : SHEET, className]
    .filter(Boolean)
    .join(' ')

  return (
    <dialog
      ref={dialogRef}
      className={classes}
      aria-modal="true"
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClose={handleClose}
      onClick={handleBackdrop}
      {...rest}
    >
      <h2
        id={titleId}
        className="font-headline text-headline-md font-semibold text-fg-2"
      >
        {title}
      </h2>
      {children}
    </dialog>
  )
}
