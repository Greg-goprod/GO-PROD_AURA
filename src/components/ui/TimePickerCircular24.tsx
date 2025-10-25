import * as React from 'react'
import cn from 'classnames'

type TimePickerProps = {
  value?: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  className?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => i + 1)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

function polarToCartesian(radius: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  const x = radius + radius * Math.cos(rad)
  const y = radius + radius * Math.sin(rad)
  return { x, y }
}

function getHourPosition(index: number, inner: boolean) {
  const angle = (360 / 12) * index
  const radius = inner ? 70 : 110
  return polarToCartesian(radius, angle)
}

function getMinutePosition(index: number) {
  const angle = (360 / 12) * index
  const radius = 110
  return polarToCartesian(radius, angle)
}

export function TimePickerCircular24({ value, onChange, placeholder, className }: TimePickerProps) {
  const [mode, setMode] = React.useState<'hours' | 'minutes'>('hours')
  const [internal, setInternal] = React.useState<string | null>(value ?? null)

  React.useEffect(() => {
    setInternal(value ?? null)
  }, [value])

  const [hours, minutes] = internal ? internal.split(':').map(Number) : [null, null]

  const handleHourClick = (hour: number) => {
    setMode('minutes')
    const next = `${String(hour).padStart(2, '0')}:${String(minutes ?? 0).padStart(2, '0')}`
    setInternal(next)
    onChange(next)
  }

  const handleMinuteClick = (minute: number) => {
    if (hours == null) return
    const next = `${String(hours).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    setInternal(next)
    onChange(next)
  }

  return (
    <div className={cn('card-surface rounded-2xl p-6', className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className={cn('chip chip-xs', { active: mode === 'hours' })} onClick={() => setMode('hours')} type="button">
            Heures
          </button>
          <button className={cn('chip chip-xs', { active: mode === 'minutes' })} onClick={() => setMode('minutes')} type="button">
            Minutes
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input w-16 text-center"
            value={hours != null ? String(hours).padStart(2, '0') : ''}
            placeholder="HH"
            onChange={(e) => {
              const numeric = parseInt(e.target.value, 10)
              if (!Number.isNaN(numeric)) {
                const next = `${String(numeric).padStart(2, '0')}:${String(minutes ?? 0).padStart(2, '0')}`
                setInternal(next)
                onChange(next)
              }
            }}
          />
          <span className="text-2xl font-manrope">:</span>
          <input
            className="input w-16 text-center"
            value={minutes != null ? String(minutes).padStart(2, '0') : ''}
            placeholder="MM"
            onChange={(e) => {
              const numeric = parseInt(e.target.value, 10)
              if (!Number.isNaN(numeric)) {
                const next = `${String(hours ?? 0).padStart(2, '0')}:${String(numeric).padStart(2, '0')}`
                setInternal(next)
                onChange(next)
              }
            }}
          />
        </div>
      </div>
      <div className="flex justify-center mb-6">
        <div className="clock-circle" style={{ width: 280, height: 280 }}>
          <div className="clock-center" />
          {mode === 'hours'
            ? HOURS.map((hour) => {
                const inner = hour > 12
                const actualHour = (hour - 1) % 12
                const pos = getHourPosition(actualHour, inner)
                const selected = hours === hour
                return (
                  <button
                    key={hour}
                    className={cn('clock-number', { selected })}
                    style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                    onClick={() => handleHourClick(hour)}
                    type="button"
                  >
                    {String(hour).padStart(2, '0')}
                  </button>
                )
              })
            : MINUTES.map((minute, index) => {
                const pos = getMinutePosition(index)
                const selected = minutes === minute
                return (
                  <button
                    key={minute}
                    className={cn('clock-number', { selected })}
                    style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                    onClick={() => handleMinuteClick(minute)}
                    type="button"
                  >
                    {String(minute).padStart(2, '0')}
                  </button>
                )
              })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn btn-ghost btn-sm" onClick={() => onChange(null)} type="button">
          Réinitialiser
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            const now = new Date()
            const hh = String(now.getHours()).padStart(2, '0')
            const mm = String(Math.round(now.getMinutes() / 5) * 5).padStart(2, '0')
            const next = `${hh}:${mm}`
            setInternal(next)
            onChange(next)
          }}
          type="button"
        >
          Maintenant
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onChange('23:59')} type="button">
          23:59
        </button>
      </div>
      {placeholder ? <p className="text-sm text-[var(--text-muted)] mt-2">{placeholder}</p> : null}
    </div>
  )
}

