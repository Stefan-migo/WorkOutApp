import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Dialog } from '../Dialog'

// jsdom 29 ships no HTMLDialogElement implementation (showModal/close are
// undefined — verified at apply). Install a spec-faithful shim so the jsdom
// layer can assert the component's controlled open/close wiring. Real dialog
// behavior (focus trap/restore) is asserted in the browser a11y suite (2d.7).
beforeAll(() => {
  const proto = HTMLDialogElement.prototype as unknown as {
    showModal?: () => void
    close?: () => void
  }
  if (typeof proto.showModal !== 'function') {
    proto.showModal = function (this: HTMLDialogElement) {
      if (this.open) {
        throw new DOMException('The dialog already has an open attribute', 'InvalidStateError')
      }
      this.setAttribute('open', '')
    }
    proto.close = function (this: HTMLDialogElement) {
      if (!this.open) return
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    }
  }
})

afterEach(cleanup)

// UIP-6 (jsdom partial): assert only what jsdom implements — showModal/close,
// native cancel (ESC), backdrop click (e.target === ref.current), aria-modal
// + labelled title. Focus-restore (UIP-6b) is NOT asserted here — jsdom
// <dialog> focus behavior is partial; it is asserted in the browser a11y
// suite (2d.7, real chromium).
// Class strings are the design contract (D11): asserting them is asserting
// the token wiring (repo pattern, see Card/Badge/Input tests).
describe('Dialog (UIP-6, jsdom partial)', () => {
  it('opens a modal via showModal() when open=true and closes via close() when open=false', () => {
    const onOpenChange = vi.fn()
    const { container, rerender } = render(
      <Dialog open title="Confirm" onOpenChange={onOpenChange}>
        Content
      </Dialog>,
    )

    const dialog = container.querySelector('dialog')
    expect(dialog).not.toBeNull()
    // showModal() sets the open attribute on the native element.
    expect(dialog).toHaveAttribute('open')

    rerender(
      <Dialog open={false} title="Confirm" onOpenChange={onOpenChange}>
        Content
      </Dialog>,
    )
    expect(dialog).not.toHaveAttribute('open')
  })

  it('is a native <dialog> with aria-modal and a labelled title (UIP-6c)', () => {
    render(
      <Dialog open title="Delete exercise" onOpenChange={vi.fn()}>
        Content
      </Dialog>,
    )

    const dialog = document.querySelector('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    const labelId = dialog!.getAttribute('aria-labelledby')
    expect(labelId).toBeTruthy()
    expect(document.getElementById(labelId!)).toHaveTextContent('Delete exercise')
  })

  it('closes on the native cancel event (ESC) — preventDefault + onOpenChange(false)', () => {
    const onOpenChange = vi.fn()
    render(
      <Dialog open title="Confirm" onOpenChange={onOpenChange}>
        Content
      </Dialog>,
    )

    const dialog = document.querySelector('dialog')!
    const cancel = new Event('cancel', { cancelable: true })
    fireEvent(dialog, cancel)

    expect(cancel.defaultPrevented).toBe(true)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes on backdrop click (target === dialog) but not on content click', () => {
    const onOpenChange = vi.fn()
    render(
      <Dialog open title="Confirm" onOpenChange={onOpenChange}>
        <p>Dialog body</p>
      </Dialog>,
    )

    const dialog = document.querySelector('dialog')!

    // Clicking content inside the dialog must NOT close it.
    fireEvent.click(screen.getByText('Dialog body'))
    expect(onOpenChange).not.toHaveBeenCalled()

    // A backdrop click has the dialog element itself as event target.
    fireEvent.click(dialog)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('sheet variant carries the motion-reduce slide classes (UIP-6d)', () => {
    render(
      <Dialog open title="Sheet" variant="sheet" onOpenChange={vi.fn()}>
        Content
      </Dialog>,
    )

    const dialog = document.querySelector('dialog')!
    expect(dialog).toHaveClass(
      'translate-x-full',
      'open:translate-x-0',
      'motion-reduce:translate-x-0',
      'motion-reduce:transition-none',
    )
  })
})
