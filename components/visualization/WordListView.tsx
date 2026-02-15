"use client"

import { useMemo, useRef, useEffect } from "react"
import { GraphData } from "@/lib/graph/types"
import { computeNodeWeights, WeightedNode } from "@/lib/graph/weights"
import { useGraphInteraction } from "@/lib/graph/interactionStore"
import { getNeighborIds } from "@/lib/graph/neighbors"
import { GROUP_FILL, GROUP_LABELS } from "@/lib/graph/colors"

type WordListViewProps = {
  graph: GraphData
  filter: string[]
  fills?: Record<string, string>
}

const GROUP_COLORS: Record<string, string> = {
  actor: "bg-indigo-500/15 text-indigo-400",
  activity: "bg-amber-500/15 text-amber-400",
  tag: "bg-emerald-400/15 text-emerald-400",
  unknown: "bg-neutral-500/15 text-neutral-500",
}

export default function WordListView({ graph, filter, fills }: WordListViewProps) {
  const f = fills ?? GROUP_FILL
  const weighted = useMemo(
    () => computeNodeWeights(graph, filter),
    [graph, filter]
  )

  const maxWeight = weighted[0]?.weight ?? 1

  const {
    selectedNodeId,
    highlightedNodeIds,
    selectNode,
    setHighlights,
  } = useGraphInteraction()

  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [selectedNodeId])

  function handleClick(node: WeightedNode) {
    if (selectedNodeId === node.id) {
      selectNode(undefined)
      setHighlights([])
      return
    }
    selectNode(node.id)
    setHighlights(getNeighborIds(graph, node.id))
  }

  return (
    <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
      {weighted.map((node) => {
        const isSelected = node.id === selectedNodeId
        const isNeighbor = highlightedNodeIds.includes(node.id)
        const barWidth = Math.max((node.weight / maxWeight) * 100, 4)

        return (
          <button
            key={node.id}
            ref={isSelected ? selectedRef : undefined}
            onClick={() => handleClick(node)}
            className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-all group ${
              isSelected
                ? "ring-2 ring-accent-purple bg-surface shadow-lg shadow-accent-purple/5"
                : isNeighbor
                ? "bg-surface-hover"
                : "hover:bg-surface-hover"
            }`}
          >
            <span
              className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ backgroundColor: f[node.group] ? f[node.group] + '20' : '#6b6b8020', color: f[node.group] ?? '#6b6b80' }}
            >
              {GROUP_LABELS[node.group] ?? node.group}
            </span>

            <span
              className={`flex-1 text-sm truncate ${
                isSelected ? "font-semibold text-foreground" : "text-foreground/70"
              }`}
            >
              {node.label}
            </span>

            <div className="w-24 h-1.5 bg-border-bright rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isSelected
                    ? "bg-accent-purple"
                    : isNeighbor
                    ? "bg-accent-teal"
                    : "bg-border-bright"
                }`}
                style={{ width: `${barWidth}%` }}
              />
            </div>

            <span className="text-xs text-muted w-6 text-right tabular-nums">
              {node.weight}
            </span>
          </button>
        )
      })}
      {weighted.length === 0 && (
        <p className="text-sm text-muted py-8 text-center">
          No nodes match the current filter.
        </p>
      )}
    </div>
  )
}
