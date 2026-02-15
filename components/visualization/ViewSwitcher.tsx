"use client"

export type ViewMode = "list" | "cloud" | "d3cloud" | "animated" | "tree" | "force" | "bubble" | "heatmap" | "pie"

const OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "list", label: "List" },
  { value: "cloud", label: "Ring Cloud" },
  { value: "d3cloud", label: "Word Cloud" },
  { value: "animated", label: "Animated Cloud" },
  { value: "force", label: "Force Graph" },
  { value: "bubble", label: "Bubble Pack" },
  { value: "heatmap", label: "Heatmap" },
  { value: "tree", label: "Tree" },
  { value: "pie", label: "Pie Chart" },
]

type ViewSwitcherProps = {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

export default function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ViewMode)}
      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-surface text-foreground/80 hover:border-border-bright hover:text-foreground transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-purple/50 focus:border-accent-purple/50 appearance-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b6b80' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
        paddingRight: "28px",
      }}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
