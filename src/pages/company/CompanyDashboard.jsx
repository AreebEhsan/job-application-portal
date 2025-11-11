export default function CompanyDashboard() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      <div className="text-center">
        <h1 className="text-5xl font-bold">Company Dashboard</h1>
        <p className="text-white/70 mt-2">Manage job postings, applicants, and analytics.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          {title: "Open Jobs", desc: "Manage or edit your current postings."},
          {title: "Applicants", desc: "View applicants per role and progress status."},
          {title: "Analytics", desc: "Track job performance metrics."}
        ].map((item) => (
          <div key={item.title} className="glass p-6 hover:scale-[1.02] transition-transform fade-in">
            <h3 className="text-xl font-semibold">{item.title}</h3>
            <p className="text-sm text-white/70 mt-2">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
