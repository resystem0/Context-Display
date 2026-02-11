"use client"

import { useMemo, useRef, useEffect } from "react"
import { GraphData } from "@/lib/graph/types"
import { computeNodeWeights, WeightedNode } from "@/lib/graph/weights"
import { useGraphInteraction } from "@/lib/graph/interactionStore"
import { getNeighborIds } from "@/lib/graph/neighbors"

type WordListViewProps = {
  graph: GraphData
  filter: string[]
}

const GROUP_COLORS: Record<string, string> = {
  actor: "bg-blue-100 text-blue-800",
  activity: "bg-amber-100 text-amber-800",
  tag: "bg-emerald-100 text-emerald-800",
  unknown: "bg-neutral-100 text-neutral-600",
}

export default function WordListView({ graph, filter }: WordListViewProps) {
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
                ? "ring-2 ring-neutral-900 bg-white shadow-sm dark:ring-neutral-100 dark:bg-neutral-800"
                : isNeighbor
                ? "bg-neutral-50 dark:bg-neutral-800/50"
                : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            }`}
          >
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                GROUP_COLORS[node.group] ?? GROUP_COLORS.unknown
              }`}
            >
              {node.group}
            </span>

            <span
              className={`flex-1 text-sm truncate ${
                isSelected ? "font-semibold text-neutral-900 dark:text-neutral-100" : "text-neutral-700 dark:text-neutral-300"
              }`}
            >
              {node.label}
            </span>

            <div className="w-24 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isSelected
                    ? "bg-neutral-900"
                    : isNeighbor
                    ? "bg-neutral-500"
                    : "bg-neutral-300"
                }`}
                style={{ width: `${barWidth}%` }}
              />
            </div>

            <span className="text-xs text-neutral-400 dark:text-neutral-500 w-6 text-right tabular-nums">
              {node.weight}
            </span>
          </button>
        )
      })}
      {weighted.length === 0 && (
        <p className="text-sm text-neutral-400 py-8 text-center">
          No nodes match the current filter.
        </p>
      )}
    </div>
  )
}
