import * as React from 'react'
import cn from 'classnames'
import dayjs from 'dayjs'
import { Icon } from './Icon'

type DatePickerProps = {
  value?: Date | null
  onChange: (date: Date | null) => void
  className?: string
  disabledDates?: (date: Date) => boolean
}

const WEEKDAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

function getDaysGrid(current: dayjs.Dayjs) {
  const startOfMonth = current.startOf('month')
  const startWeekDay = (startOfMonth.day() + 6) % 7
  const daysInMonth = current.daysInMonth()
  const days: Array<{ date: dayjs.Dayjs; disabled?: boolean }> = []

  for (let i = 0; i < startWeekDay; i++) {
    days.push({ date: startOfMonth.subtract(startWeekDay - i, 'day'), disabled: true })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: startOfMonth.date(i) })
  }
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1].date
    days.push({ date: last.add(1, 'day'), disabled: true })
  }
  return days
}

export function DatePickerAura({ value, onChange, className, disabledDates }: DatePickerProps) {
  const [viewDate, setViewDate] = React.useState(() => dayjs(value ?? new Date()))

  const days = React.useMemo(() => getDaysGrid(viewDate), [viewDate])

  const isSelected = (date: dayjs.Dayjs) => (value ? dayjs(value).isSame(date, 'day') : false)

  return (
    <div className={cn('card-surface rounded-2xl p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <button className="btn btn-ghost btn-sm" onClick={() => setViewDate((prev) => prev.subtract(1, 'month'))} type="button">
          <Icon name="ChevronLeft" />
        </button>
        <div className="text-sm font-semibold">{viewDate.format('MMMM YYYY')}</div>
        <button className="btn btn-ghost btn-sm" onClick={() => setViewDate((prev) => prev.add(1, 'month'))} type="button">
          <Icon name="ChevronRight" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-semibold py-2 text-[var(--text-muted)]">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, disabled }) => {
          const isDisabled = disabled || disabledDates?.(date.toDate())
          return (
            <button
              key={date.format('YYYY-MM-DD')}
              className={cn('calendar-day', {
                disabled: isDisabled,
                selected: isSelected(date),
              })}
              onClick={() => (isDisabled ? null : onChange(date.toDate()))}
              type="button"
            >
              {date.date()}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => onChange(dayjs().toDate())} type="button">
          Aujourd'hui
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onChange(dayjs().subtract(7, 'day').toDate())} type="button">
          -7 jours
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onChange(dayjs().add(7, 'day').toDate())} type="button">
          +7 jours
        </button>
      </div>
    </div>
  )
}





