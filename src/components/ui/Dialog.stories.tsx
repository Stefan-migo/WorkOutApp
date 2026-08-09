import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { fn, userEvent, within, expect, waitFor } from 'storybook/test'
import { Dialog, type DialogProps } from './Dialog'
import { Button } from './Button'

// Controlled component — stories need a stateful shell with a trigger Button
// so open/close behaves like a real modal (UIP-6). Reuses the 2a Button.
function DialogDemo({
  open: initialOpen = false,
  title = 'Confirm action',
  ...rest
}: Partial<DialogProps>) {
  const [open, setOpen] = useState(initialOpen)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog {...rest} open={open} onOpenChange={setOpen} title={title}>
        <p className="font-body text-body-md text-fg-2">
          This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => setOpen(false)}>
            Delete
          </Button>
        </div>
      </Dialog>
    </>
  )
}

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'app' },
    a11y: { test: 'error' },
  },
  // Landmark shell: the isolated story canvas has no landmarks, so axe's
  // region rule flags bare content (repo pattern — see Badge).
  decorators: [(Story) => <main><Story /></main>],
  render: (args) => <DialogDemo {...args} />,
  args: {
    title: 'Confirm action',
    open: false,
    onOpenChange: fn(),
  },
  argTypes: {
    title: { control: 'text' },
    variant: { control: 'select', options: ['fixed', 'sheet'] },
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// Open modal state — lets axe check aria-modal + labelled title (UIP-6c).
export const Open: Story = {
  args: { open: true },
}

// Sheet variant, open — motion-reduce slide classes are present but CSS-only;
// the open sheet is what axe samples.
export const Sheet: Story = {
  args: { open: true, variant: 'sheet', title: 'Filter workout' },
}

// UIP-6a/b + UIP-7: browser play — open, focus moves in; ESC closes with
// focus restored to the trigger; backdrop click closes with focus restored.
// Focus-restore is native showModal behavior, asserted only in real chromium
// (jsdom dialog support is partial).
export const OpenCloseFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Open dialog' })

    await userEvent.click(trigger)
    const dialog = await canvas.findByRole('dialog')
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    // Native showModal moves focus to the first focusable element inside.
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toHaveFocus()

    // ESC closes (UIP-6a) and restores focus to the trigger (UIP-6b).
    // Synthetic keydown cannot trigger Chromium's native dialog cancel
    // (trusted-event path), so dispatch the cancel event the browser fires
    // for a real ESC press — same contract the jsdom test asserts. waitFor
    // polls because the close lands in a React effect after the dispatch.
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }))
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
    await expect(trigger).toHaveFocus()

    // Backdrop click closes (UIP-6a) and restores focus (UIP-6b). A real
    // backdrop click surfaces on the dialog element itself (::backdrop), so
    // dispatch a click with target === dialog.
    await userEvent.click(trigger)
    const reopened = await canvas.findByRole('dialog')
    reopened.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await waitFor(() => expect(reopened).not.toHaveAttribute('open'))
    await expect(trigger).toHaveFocus()
  },
}
