interface StrainGaugeProps {
  avgRpe: number
}

export default function StrainGauge({ avgRpe }: StrainGaugeProps) {
  const gaugeR = 80
  const gaugeCirc = 2 * Math.PI * gaugeR
  const gaugeOffset = gaugeCirc - (avgRpe / 10) * gaugeCirc

  return (
    <div className="md:col-span-4 glass-card rounded-xl p-16 flex flex-col h-96 ambient-shadow justify-between">
      <div className="pb-3">
        <h3 className="font-headline-md text-headline-md text-fg-2">
          Average Strain
        </h3>
        <p className="font-body-md text-body-md text-muted">
          RPE Focus
        </p>
      </div>
      {/* ponytail: work/rest ratio as RPE proxy — no actual RPE tracking */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 184 184">
            <circle
              cx="92" cy="92" r={gaugeR}
              fill="none" stroke="currentColor" strokeWidth="16"
              className="text-surface-variant"
            />
            <circle
              cx="92" cy="92" r={gaugeR}
              fill="none" stroke="currentColor" strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={gaugeCirc}
              strokeDashoffset={gaugeOffset}
              className="text-accent-container transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display-timer-mobile text-display-timer-mobile text-accent leading-none">
              {avgRpe}
            </span>
            <span className="font-label-caps text-label-caps text-muted mt-1">
              Avg RPE
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
