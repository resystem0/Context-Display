"use client"

import { NodeGroup } from "@/lib/graph/types"

const GROUPS: { value: NodeGroup; label: string; color: string }[] = [
  { value: "actor", label: "From", color: "border-indigo-500/50 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20" },
  { value: "activity", label: "About", color: "border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" },
  { value: "tag", label: "Tags", color: "border-accent-teal/50 bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20" },
]

type FilterBarProps = {
  active: string[]
  onChange: (groups: string[]) => void
}

export default function FilterBar({ active, onChange }: FilterBarProps) {
  function toggle(group: string) {
    if (active.includes(group)) {
      onChange(active.filter((g) => g !== group))
    } else {
      onChange([...active, group])
    }
  }

  return (
    <div className="flex gap-2">
      {GROUPS.map((g) => {
        const isActive = active.length === 0 || active.includes(g.value)
        return (
          <button
            key={g.value}
            onClick={() => toggle(g.value)}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-all duration-200 ${
              isActive
                ? g.color
                : "border-border bg-transparent text-muted hover:border-border-bright hover:text-foreground/60"
            }`}
          >
            {g.label}
          </button>
        )
      })}
      {active.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="px-3 py-1 text-xs font-medium rounded-full border border-border text-muted hover:border-border-bright hover:text-foreground/60 transition-all duration-200"
        >
          All
        </button>
      )}
    </div>
  )
}
