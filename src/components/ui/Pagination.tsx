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

  const btnBase =
    'px-3 py-1.5 rounded-md text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-40 disabled:cursor-not-allowed'
  const btnActive = 'bg-white/10 border border-white/20 text-white hover:bg-white/20'

  return (
    <div className="flex items-center justify-center gap-3 mt-6" aria-label="Pagination">
      <button
        className={`${btnBase} ${btnActive}`}
        onClick={() => onPageChange(page - 1)}
        disabled={!canPrev}
        aria-label="Previous page"
      >
        ← Prev
      </button>

      <span className="text-sm text-white/70">
        Page {page} of {totalPages}
      </span>

      <button
        className={`${btnBase} ${btnActive}`}
        onClick={() => onPageChange(page + 1)}
        disabled={!canNext}
        aria-label="Next page"
      >
        Next →
      </button>
    </div>
  )
}
