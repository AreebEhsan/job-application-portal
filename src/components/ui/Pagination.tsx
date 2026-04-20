interface PaginationProps {
  page: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalCount, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize)
  if (totalPages <= 1) return null

  const canPrev = page > 1
  const canNext = page < totalPages

  const btn = (disabled: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
     border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20
     focus:outline-none focus:ring-2 focus:ring-violet-500/50
     disabled:opacity-30 disabled:cursor-not-allowed
     ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`

  return (
    <nav className="flex items-center justify-center gap-4 mt-8" aria-label="Pagination">
      <button
        className={btn(!canPrev)}
        onClick={() => onPageChange(page - 1)}
        disabled={!canPrev}
        aria-label="Previous page"
      >
        ← Prev
      </button>

      <span className="text-sm text-white/50 tabular-nums">
        <span className="text-white font-medium">{page}</span>
        {' '}/ {totalPages}
      </span>

      <button
        className={btn(!canNext)}
        onClick={() => onPageChange(page + 1)}
        disabled={!canNext}
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  )
}
