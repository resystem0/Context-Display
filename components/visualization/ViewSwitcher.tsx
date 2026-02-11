"use client"

export type ViewMode = "list" | "cloud" | "tree" | "pie"

const OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "list", label: "List" },
  { value: "cloud", label: "Word Cloud" },
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
      className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-500 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
