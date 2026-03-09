import { cn } from '@/lib/utils'

export function Input({ className, label, error, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-text-secondary">{label}</label>
      )}
      <input
        className={cn(
          'w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text-primary',
          'placeholder:text-text-muted',
          'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
          'transition-colors duration-150',
          error && 'border-danger focus:ring-danger/50',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}

export function Select({ className, label, children, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-text-secondary">{label}</label>
      )}
      <select
        className={cn(
          'w-full rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text-primary',
          'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
          'transition-colors duration-150',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
