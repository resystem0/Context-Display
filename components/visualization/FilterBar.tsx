"use client"

import { NodeGroup } from "@/lib/graph/types"

const GROUPS: { value: NodeGroup; label: string }[] = [
  { value: "actor", label: "Actors" },
  { value: "activity", label: "Activities" },
  { value: "tag", label: "Tags" },
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
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              isActive
                ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white"
                : "bg-white text-neutral-400 border-neutral-200 hover:border-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700 dark:hover:border-neutral-500"
            }`}
          >
            {g.label}
          </button>
        )
      })}
      {active.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="px-3 py-1.5 text-sm rounded-full border border-neutral-200 text-neutral-500 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-500 transition-colors"
        >
          All
        </button>
      )}
    </div>
  )
}
