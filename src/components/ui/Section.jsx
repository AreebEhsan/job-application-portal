export function Section({ title, subtitle, right, className = "", children }) {
  return (
    <section className={`max-w-6xl mx-auto px-4 md:px-6 ${className}`}>
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
          {subtitle && <p className="text-muted mt-1">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
