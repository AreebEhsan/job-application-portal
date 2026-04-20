import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'violet' | 'indigo' | 'success' | 'warning' | 'danger'
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-white/8 border-white/12 text-slate-200',
  violet:  'bg-violet-500/20 border-violet-400/40 text-violet-200',
  indigo:  'bg-indigo-500/20 border-indigo-400/40 text-indigo-200',
  success: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200',
  warning: 'bg-amber-500/15 border-amber-400/40 text-amber-200',
  danger:  'bg-red-500/15 border-red-400/40 text-red-200',
}

export function Badge({ variant = 'default', className = '', ...props }: BadgeProps) {
  return (
    <span className={clsx('badge', variants[variant], className)} {...props} />
  )
}
