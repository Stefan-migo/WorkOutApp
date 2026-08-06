'use client'

import { useState } from 'react'

interface ExercisePanelProps {
  name: string
  description?: string
  imageUrl?: string
  chips?: string[]
  // NEW: richer data from Exercise object
  images?: string[]
  instructions?: string[]
  force?: string
  mechanic?: string
  difficulty?: string
  primaryMuscles?: string[]
  secondaryMuscles?: string[]
  equipment?: string[]
  category?: string
  exerciseId?: string
}

export function ExercisePanel({
  name,
  description,
  imageUrl,
  chips,
  images,
  instructions,
  force,
  mechanic,
  difficulty,
  primaryMuscles,
  secondaryMuscles,
  equipment,
  category,
  exerciseId,
}: ExercisePanelProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [showInstructions, setShowInstructions] = useState(false)

  const galleryImages = images ?? (imageUrl ? [imageUrl] : [])
  const displayImage = galleryImages[selectedImage]

  const chipClass =
    'px-3 py-1 rounded-full bg-surface-tint/20 text-white font-label-caps text-label-caps border border-white/10'

  // Not-found fallback
  if (!name) {
    return (
      <div className="glass-panel-dark rounded-xl p-16 w-full max-w-lg flex flex-col items-center text-center">
        <svg className="w-12 h-12 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6.75a.75.75 0 0 0-.75.75v9a.75.75 0 0 0 1.5 0v-9a.75.75 0 0 0-.75-.75Zm-9 0a.75.75 0 0 0-.75.75v9a.75.75 0 0 0 1.5 0v-9a.75.75 0 0 0-.75-.75Zm10.5 0a2.25 2.25 0 0 1 2.25 2.25v4.5a2.25 2.25 0 0 1-2.25 2.25h-9A2.25 2.25 0 0 1 6 13.5v-4.5A2.25 2.25 0 0 1 8.25 6.75h9Z" />
        </svg>
        <p className="font-body-md text-body-md text-gray-300 mt-8">
          Exercise not found{exerciseId ? ` (ID: ${exerciseId})` : ''}
        </p>
      </div>
    )
  }

  return (
    <div className="glass-panel-dark rounded-xl p-16 w-full max-w-lg flex flex-col">
      {/* Image Gallery */}
      <div className="w-full h-64 bg-accent rounded-lg mb-16 overflow-hidden relative border border-white/5 flex items-center justify-center">
        {displayImage ? (
          <img src={displayImage} alt={name} className="w-full h-full object-contain" />
        ) : (
          <svg className="w-12 h-12 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6.75a.75.75 0 0 0-.75.75v9a.75.75 0 0 0 1.5 0v-9a.75.75 0 0 0-.75-.75Zm-9 0a.75.75 0 0 0-.75.75v9a.75.75 0 0 0 1.5 0v-9a.75.75 0 0 0-.75-.75Zm10.5 0a2.25 2.25 0 0 1 2.25 2.25v4.5a2.25 2.25 0 0 1-2.25 2.25h-9A2.25 2.25 0 0 1 6 13.5v-4.5A2.25 2.25 0 0 1 8.25 6.75h9Z" />
          </svg>
        )}
      </div>

      {/* Thumbnails */}
      {galleryImages.length > 1 && (
        <div className="flex gap-2 mb-16 justify-center">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`w-10 h-10 rounded-md overflow-hidden border-2 transition-colors ${
                idx === selectedImage ? 'border-white' : 'border-white/20 hover:border-white/50'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Name */}
      <h2 className="font-headline-lg text-headline-lg text-white mb-xs">{name}</h2>

      {/* Description */}
      {description && <p className="font-body-md text-body-md text-gray-300 mb-16">{description}</p>}

      {/* Badge row: category, difficulty, force, mechanic */}
      {[category, difficulty, force, mechanic].some(Boolean) && (
        <div className="flex flex-wrap gap-2 mb-16">
          {category && <span className={chipClass}>{category}</span>}
          {difficulty && <span className={chipClass}>{difficulty}</span>}
          {force && <span className={chipClass}>{force}</span>}
          {mechanic && <span className={chipClass}>{mechanic}</span>}
        </div>
      )}

      {/* Primary muscles */}
      {primaryMuscles && primaryMuscles.length > 0 && (
        <div className="mb-8">
          <p className="font-label-caps text-label-caps text-gray-400 mb-xs">Primary Muscles</p>
          <div className="flex flex-wrap gap-2">
            {primaryMuscles.map((m) => (
              <span key={m} className={chipClass}>{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* Secondary muscles */}
      {secondaryMuscles && secondaryMuscles.length > 0 && (
        <div className="mb-8">
          <p className="font-label-caps text-label-caps text-gray-400 mb-xs">Secondary Muscles</p>
          <div className="flex flex-wrap gap-2">
            {secondaryMuscles.map((m) => (
              <span key={m} className={chipClass}>{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* Equipment */}
      {equipment && equipment.length > 0 && (
        <div className="mb-8">
          <p className="font-label-caps text-label-caps text-gray-400 mb-xs">Equipment</p>
          <div className="flex flex-wrap gap-2">
            {equipment.map((e) => (
              <span key={e} className={chipClass}>{e}</span>
            ))}
          </div>
        </div>
      )}

      {/* Legacy chips */}
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {chips.map((chip) => (
            <span key={chip} className={chipClass}>{chip}</span>
          ))}
        </div>
      )}

      {/* Instructions (collapsible) */}
      {instructions && instructions.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-2 text-white font-label-caps text-label-caps hover:text-gray-300 transition-colors"
          >
            {showInstructions ? 'Hide instructions ▲' : 'Show instructions ▼'}
          </button>
          {showInstructions && (
            <ol className="flex flex-col gap-4 mt-8 list-decimal list-inside">
              {instructions.map((step, idx) => (
                <li key={idx} className="font-body-md text-body-md text-gray-300">{step}</li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}
