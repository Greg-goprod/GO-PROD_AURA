import * as React from 'react'
import cn from 'classnames'
import dayjs from 'dayjs'
import { DatePickerAura } from './DatePickerAura'
import { TimePickerCircular24 } from './TimePickerCircular24'
import { Input } from './Input'

type DateTimePickerProps = {
  value?: Date | null
  onChange: (date: Date | null) => void
  className?: string
}

export function DateTimePickerAura({ value, onChange, className }: DateTimePickerProps) {
  const [internal, setInternal] = React.useState<Date | null>(value ?? null)

  React.useEffect(() => {
    setInternal(value ?? null)
  }, [value])

  const timeValue = internal ? dayjs(internal).format('HH:mm') : null

  const handleDateChange = (newDate: Date | null) => {
    if (!newDate) {
      setInternal(null)
      onChange(null)
      return
    }
    const combined = internal ? dayjs(internal).year(dayjs(newDate).year()).month(dayjs(newDate).month()).date(dayjs(newDate).date()) : dayjs(newDate)
    setInternal(combined.toDate())
    onChange(combined.toDate())
  }

  const handleTimeChange = (time: string | null) => {
    if (!time) {
      setInternal(null)
      onChange(null)
      return
    }
    const [hh, mm] = time.split(':').map(Number)
    const base = internal ? dayjs(internal) : dayjs()
    const combined = base.hour(hh).minute(mm ?? 0)
    setInternal(combined.toDate())
    onChange(combined.toDate())
  }

  return (
    <div className={cn('card-surface rounded-2xl p-6', className)}>
      <div className="mb-4">
        <label className="text-sm text-[var(--text-muted)] mb-1 block">Date & Heure</label>
        <Input value={internal ? dayjs(internal).format('DD.MM.YYYY HH:mm') : ''} placeholder="DD.MM.YYYY HH:mm" readOnly />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 rounded-xl" style={{ background: 'rgba(21,23,43,0.4)', border: '1px solid var(--border-default)' }}>
        <DatePickerAura value={internal ?? undefined} onChange={handleDateChange} />
        <TimePickerCircular24 value={timeValue ?? undefined} onChange={handleTimeChange} placeholder="Sélection par pas de 5 minutes" />
      </div>
      <div className="flex items-center justify-end gap-2 mt-6">
        <button className="btn btn-secondary btn-md" onClick={() => onChange(null)} type="button">
          Effacer
        </button>
        <button className="btn btn-primary btn-md" onClick={() => onChange(internal)} type="button">
          Valider
        </button>
      </div>
    </div>
  )
}





