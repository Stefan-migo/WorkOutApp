import { useEffect, useRef } from 'react'

export function useIntervalDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()

    const viewport = window.visualViewport
    if (!viewport) return

    function resizeSheet() {
      if (!dialog || !viewport) return
      const coveredBottom = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
      dialog.style.setProperty('--interval-viewport-height', `${viewport.height}px`)
      dialog.style.setProperty('--interval-viewport-bottom', `${coveredBottom}px`)
    }

    resizeSheet()
    viewport.addEventListener('resize', resizeSheet)
    viewport.addEventListener('scroll', resizeSheet)
    return () => {
      viewport.removeEventListener('resize', resizeSheet)
      viewport.removeEventListener('scroll', resizeSheet)
    }
  }, [])

  return dialogRef
}
