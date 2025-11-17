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
      <textarea 
        className={cn(
          'textarea',
          'px-3 py-2',
          'rounded-lg',
          'border border-gray-300 dark:border-gray-600',
          'bg-white dark:bg-gray-800',
          'text-gray-900 dark:text-gray-100',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'placeholder:text-gray-400 dark:placeholder:text-gray-500',
          'resize-vertical',
          'transition-colors',
          className
        )} 
        {...rest} 
      />
      {error ? <span className="text-sm" style={{ color: 'var(--error)' }}>{error}</span> : helperText ? <span className="text-sm text-[var(--text-muted)]">{helperText}</span> : null}
    </label>
  )
}





