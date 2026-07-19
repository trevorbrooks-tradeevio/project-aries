/* Goals — static display of long-range goals by category. Not an editable
   list (no add/edit/delete/reorder); the content here is authored directly
   rather than driven by user state. */

const CATEGORIES: { title: string; items: string[] }[] = [
  { title: "Travel", items: ["South Korea", "Ireland", "Portugal", "Caribbean Island"] },
  { title: "Investment & Financial", items: ["One property", "Double Roth IRA", "$500,000 in revenue"] },
  { title: "Personal", items: ["Build relationships", "Read/listen", "One book a month", "One blog a week", "Seven hours of sleep"] },
];

export function GoalsView() {
  return (
    <>
      <div className="view-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow"><span className="slash">/</span>Focus</span>
          <h1 className="view-title">Goals</h1>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 640 }}>
        {CATEGORIES.map((cat) => (
          <div key={cat.title}>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                fontSize: 15,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                color: "var(--text)",
                margin: "0 0 6px",
              }}
            >
              {cat.title}
            </h2>
            <ul
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 300,
                color: "var(--text-2)",
                lineHeight: 1.7,
                margin: 0,
                paddingLeft: 20,
                listStyle: "disc",
              }}
            >
              {cat.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
