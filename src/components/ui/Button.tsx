import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'btn ' + (variant === 'primary' ? 'btn-primary' : 'btn-ghost')
  return <button className={`${base} ${className}`} {...props} />
}
