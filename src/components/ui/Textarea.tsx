import * as React from 'react'
import cn from 'classnames'

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  helperText?: string
  error?: string
}

export function Textarea({ label, helperText, error, className, ...rest }: Props) {
  return (
    <label className="flex flex-col gap-1">
      {label ? <span className="text-sm text-[var(--text-muted)]">{label}</span> : null}
      <textarea className={cn('textarea', className)} {...rest} />
      {error ? <span className="text-sm" style={{ color: 'var(--error)' }}>{error}</span> : helperText ? <span className="text-sm text-[var(--text-muted)]">{helperText}</span> : null}
    </label>
  )
}





