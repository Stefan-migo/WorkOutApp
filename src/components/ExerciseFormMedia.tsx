'use client'

import { useId, useRef, useState } from 'react'
import { isExerciseVideo } from '@/lib/exercise-media'
import type { useExerciseDemoDraft } from '@/hooks/useExerciseDemoDraft'
import { ExerciseCamera } from './ExerciseCamera'
import { ExerciseMedia } from './ExerciseMedia'
import { ExerciseTrimEditor } from './ExerciseTrimEditor'
import { EXERCISE_FIELD } from './ExerciseFormDetails'
import { Button } from './ui/Button'

export function ExerciseFormMedia({ demonstration, images, onImagesChange, onImageUpload, uploading, setUploading, saving }: {
  demonstration: ReturnType<typeof useExerciseDemoDraft>
  images: string[]
  onImagesChange: (images: string[]) => void
  onImageUpload?: (file: File) => Promise<string>
  uploading: boolean
  setUploading: (uploading: boolean) => void
  saving: boolean
}) {
  const headingId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [uploadError, setUploadError] = useState('')

  function addImageLink() {
    const value = imageUrl.trim()
    if (!value) return

    try {
      const url = new URL(value)
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error()
    } catch {
      setUploadError('Enter a full image link starting with https:// or http://.')
      return
    }

    if (!images.includes(value)) onImagesChange([...images, value])
    setImageUrl('')
    setUploadError('')
  }

  async function upload(file: File) {
    if (!onImageUpload) return
    setUploading(true)
    setUploadError('')
    try {
      const url = await onImageUpload(file)
      if (url && !images.includes(url)) onImagesChange([...images, url])
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Could not upload the image. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section aria-labelledby={headingId} className="grid gap-8 rounded-xl border border-border-soft bg-surface-warm p-16">
      <div>
        <h3 id={headingId} className="text-base font-semibold">Demonstration <span className="text-sm font-normal text-muted">(optional)</span></h3>
        <p className="text-sm text-muted">Record a short clip or add an image or GIF so the movement is easy to follow.</p>
      </div>
      {demonstration.cameraOpen ? (
        <ExerciseCamera onCapture={demonstration.capture} onCancel={() => demonstration.setCameraOpen(false)} />
      ) : (
        <>
          {demonstration.file && demonstration.preview && (
            <ExerciseTrimEditor
              key={demonstration.preview}
              preview={demonstration.preview}
              duration={demonstration.duration}
              range={demonstration.range}
              onChange={demonstration.changeRange}
              videoRef={demonstration.videoRef}
              disabled={saving}
            />
          )}
          <div className="flex flex-wrap gap-8">
            <Button variant="outline" className="bg-surface" onClick={() => demonstration.setCameraOpen(true)}>
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">videocam</span>
              {demonstration.file ? 'Record again' : 'Record demonstration'}
            </Button>
            {demonstration.file && <Button variant="ghost" onClick={demonstration.discard}>Discard recording</Button>}
            {onImageUpload && (
              <Button variant="outline" className="bg-surface" onClick={() => fileInputRef.current?.click()}>
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">upload</span>
                Upload image
              </Button>
            )}
          </div>
          <details>
            <summary className="min-h-[44px] w-fit cursor-pointer rounded-lg py-8 text-sm font-semibold text-accent focus-visible:focus-ring">Add an image link</summary>
            <div className="flex flex-wrap items-end gap-8">
              <label className="grid min-w-[10rem] flex-1 gap-xs text-sm font-semibold">
                Image URL
                <input
                  type="text"
                  inputMode="url"
                  value={imageUrl}
                  onChange={(event) => { setImageUrl(event.target.value); setUploadError('') }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addImageLink()
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  className={EXERCISE_FIELD}
                />
              </label>
              <Button variant="outline" className="bg-surface" onClick={addImageLink} disabled={!imageUrl.trim()}>Add link</Button>
            </div>
          </details>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        hidden
        ref={fileInputRef}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (file) void upload(file)
        }}
      />
      {uploading && <p role="status" className="text-sm text-muted">Uploading image…</p>}
      {uploadError && <p role="alert" className="text-sm text-danger">{uploadError}</p>}
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {images.map((url, index) => (
            <li key={url} className="min-w-0 rounded-lg border border-border-soft bg-surface">
              <div className="grid aspect-video place-items-center overflow-hidden rounded-t-lg bg-surface-warm">
                <ExerciseMedia key={url} src={url} alt={isExerciseVideo(url) ? 'Saved demonstration' : `Exercise image ${index + 1}`} className="size-full object-contain" loading="lazy" />
              </div>
              <div className="flex items-center justify-between gap-xs pl-8">
                <span className="truncate text-xs text-muted">{isExerciseVideo(url) ? 'Video' : `Image ${index + 1}`}</span>
                <button
                  type="button"
                  onClick={() => onImagesChange(images.filter((image) => image !== url))}
                  className="grid size-[44px] shrink-0 place-items-center rounded-lg text-muted hover:text-danger focus-visible:focus-ring"
                  aria-label={isExerciseVideo(url) ? 'Remove demonstration' : `Remove image ${index + 1}`}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
