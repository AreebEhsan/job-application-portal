import type { ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const variantClass =
    variant === 'primary' ? 'btn-primary' :
    'btn-ghost'

  const sizeClass =
    size === 'sm' ? 'px-3 py-1.5 text-xs' :
    size === 'lg' ? 'px-6 py-3 text-base' :
    ''

  return (
    <button
      className={clsx('btn', variantClass, sizeClass, className)}
      {...props}
    />
  )
}
