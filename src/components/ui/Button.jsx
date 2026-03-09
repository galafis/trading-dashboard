import { cn } from '@/lib/utils'

const variants = {
  primary: 'bg-accent hover:bg-accent-hover text-white',
  success: 'bg-success hover:bg-success/80 text-white',
  danger: 'bg-danger hover:bg-danger/80 text-white',
  ghost: 'bg-transparent hover:bg-surface-alt text-text-secondary hover:text-text-primary',
  outline: 'border border-border hover:border-border-hover bg-transparent text-text-secondary hover:text-text-primary',
}

const sizes = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-accent/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
