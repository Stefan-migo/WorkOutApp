'use client'

interface ExercisePanelProps {
  name: string
  description?: string
  imageUrl?: string
  chips?: string[]
}

export function ExercisePanel({ name, description, imageUrl, chips }: ExercisePanelProps) {
  return (
    <div className="glass-panel-dark rounded-xl p-16 w-full max-w-lg flex flex-col items-center text-center">
      {/* Image Area */}
      <div className="w-full h-40 bg-primary-container rounded-lg mb-16 overflow-hidden relative border border-white/5 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover opacity-80" />
        ) : (
          <span className="material-symbols-outlined text-5xl text-on-primary-container/40">fitness_center</span>
        )}
      </div>
      <h2 className="font-headline-lg text-headline-lg text-white mb-xs">{name}</h2>
      {description && <p className="font-body-md text-body-md text-gray-300">{description}</p>}
      {chips && chips.length > 0 && (
        <div className="flex gap-2 mt-16">
          {chips.map((chip) => (
            <span key={chip} className="px-3 py-1 rounded-full bg-surface-tint/20 text-white font-label-caps text-label-caps border border-white/10">{chip}</span>
          ))}
        </div>
      )}
    </div>
  )
}
