"use client"

import { useMemo } from "react"
import { GraphData } from "@/lib/graph/types"
import { computeNodeWeights, WeightedNode } from "@/lib/graph/weights"
import { useGraphInteraction } from "@/lib/graph/interactionStore"
import { getNeighborIds } from "@/lib/graph/neighbors"
import { GROUP_FILL, GROUP_LABELS } from "@/lib/graph/colors"
import { BubbleSettings, DEFAULT_BUBBLE } from "@/lib/graph/viewSettings"
import { hierarchy, pack } from "d3-hierarchy"

type BubblePackViewProps = {
  graph: GraphData
  filter: string[]
  settings?: BubbleSettings
  fills?: Record<string, string>
}

type HierarchyData = {
  id: string
  label?: string
  group?: string
  weight?: number
  children?: HierarchyData[]
}

const SVG_SIZE = 600

function truncateLabel(label: string, maxLen: number): string {
  if (label.length <= maxLen) return label
  return label.slice(0, maxLen - 1) + "\u2026"
}

export default function BubblePackView({ graph, filter, settings, fills }: BubblePackViewProps) {
  const s = settings ?? DEFAULT_BUBBLE
  const f = fills ?? GROUP_FILL
  const weighted = useMemo(
    () => computeNodeWeights(graph, filter),
    [graph, filter],
  )

  const {
    selectedNodeId,
    highlightedNodeIds,
    selectNode,
    setHighlights,
  } = useGraphInteraction()

  const hierarchyData = useMemo(() => {
    const groups = new Map<string, WeightedNode[]>()
    for (const node of weighted) {
      if (!groups.has(node.group)) groups.set(node.group, [])
      groups.get(node.group)!.push(node)
    }
    return {
      id: "root",
      children: Array.from(groups.entries()).map(([group, nodes]) => ({
        id: `group-${group}`,
        label: group,
        group,
        children: nodes.map(n => ({
          id: n.id,
          label: n.label,
          group: n.group,
          weight: Math.max(n.weight, 1),
        })),
      })),
    } as HierarchyData
  }, [weighted])

  const packedRoot = useMemo(() => {
    const root = hierarchy(hierarchyData)
      .sum(d => d.weight ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    return pack<HierarchyData>()
      .size([SVG_SIZE - 20, SVG_SIZE - 20])
      .padding(s.packPadding)(root)
  }, [hierarchyData])

  function handleClick(node: HierarchyData) {
    if (selectedNodeId === node.id) {
      selectNode(undefined)
      setHighlights([])
      return
    }
    selectNode(node.id)
    setHighlights(getNeighborIds(graph, node.id))
  }

  if (weighted.length === 0) {
    return (
      <p className="text-sm text-muted py-8 text-center">
        No nodes match the current filter.
      </p>
    )
  }

  const hasSelection = !!selectedNodeId
  const highlightSet = new Set(highlightedNodeIds)

  // Collect which groups contain selected or neighbor nodes
  const activeGroups = new Set<string>()
  if (hasSelection) {
    for (const descendant of packedRoot.descendants()) {
      if (descendant.depth === 2) {
        const d = descendant.data
        if (d.id === selectedNodeId || highlightSet.has(d.id)) {
          if (d.group) activeGroups.add(d.group)
        }
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      className="w-full max-h-[600px]"
      role="img"
      aria-label="Bubble pack visualization"
    >
      <g transform="translate(10,10)">
        {packedRoot.descendants().map(node => {
          const d = node.data

          // Depth 0: root - skip
          if (node.depth === 0) return null

          // Depth 1: group containers
          if (node.depth === 1) {
            const groupColor = f[d.group ?? "unknown"] ?? f.unknown ?? "#6b6b80"
            const groupOpacity = hasSelection && !activeGroups.has(d.group ?? "")
              ? 0.08
              : 0.1

            return (
              <g key={d.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  fill={groupColor}
                  fillOpacity={groupOpacity}
                  stroke={groupColor}
                  strokeDasharray="4,4"
                  strokeWidth={1}
                  strokeOpacity={hasSelection && !activeGroups.has(d.group ?? "") ? 0.2 : 0.5}
                />
                {s.showGroupLabels && <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={12}
                  fontWeight={600}
                  fill={groupColor}
                  opacity={hasSelection && !activeGroups.has(d.group ?? "") ? 0.2 : 0.6}
                  className="select-none pointer-events-none"
                >
                  {GROUP_LABELS[d.group ?? "unknown"] ?? d.label}
                </text>}
              </g>
            )
          }

          // Depth 2: leaf nodes
          const isSelected = d.id === selectedNodeId
          const isNeighbor = highlightSet.has(d.id)
          const fillColor = f[d.group ?? "unknown"] ?? f.unknown ?? "#6b6b80"

          const opacity = hasSelection
            ? isSelected
              ? 1
              : isNeighbor
                ? 0.85
                : 0.25
            : 0.9

          return (
            <g
              key={d.id}
              onClick={() => handleClick(d)}
              className="cursor-pointer"
              role="button"
              aria-label={`${d.label} (${GROUP_LABELS[d.group ?? "unknown"] ?? d.group}, weight ${d.weight})`}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill={fillColor}
                opacity={opacity}
                stroke={isSelected ? "#8b5cf6" : "none"}
                strokeWidth={isSelected ? 2.5 : 0}
              />
              {node.r > 20 && (
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fill="#fff"
                  opacity={opacity}
                  className="select-none pointer-events-none"
                >
                  {d.label}
                </text>
              )}
              {node.r > 12 && node.r <= 20 && (
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={8}
                  fill="#fff"
                  opacity={opacity}
                  className="select-none pointer-events-none"
                >
                  {truncateLabel(d.label ?? "", 8)}
                </text>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
