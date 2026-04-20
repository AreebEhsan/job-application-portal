import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export default function Card({ className = '', hover = false, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'panel p-5 text-ink',
        hover && 'transition-transform duration-300 hover:-translate-y-1 hover:shadow-glow cursor-pointer',
        className,
      )}
      {...props}
    />
  )
}
