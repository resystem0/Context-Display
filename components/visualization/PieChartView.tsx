"use client"

import { useMemo } from "react"
import { GraphData, NodeGroup } from "@/lib/graph/types"
import { computeNodeWeights, WeightedNode } from "@/lib/graph/weights"
import { useGraphInteraction } from "@/lib/graph/interactionStore"
import { getNeighborIds } from "@/lib/graph/neighbors"
import { GROUP_FILL, GROUP_LABELS } from "@/lib/graph/colors"

type PieChartViewProps = {
  graph: GraphData
  filter: string[]
  fills?: Record<string, string>
}

const GROUP_ORDER: NodeGroup[] = ["actor", "activity", "tag"]

const SVG_SIZE = 500
const CENTER = SVG_SIZE / 2
const OUTER_R = 220
const OUTER_INNER_R = 160
const INNER_R = 150
const INNER_INNER_R = 90

function polarToCart(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  }
}

function arcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const sweep = endAngle - startAngle
  const largeArc = sweep > Math.PI ? 1 : 0

  const outerStart = polarToCart(cx, cy, outerR, startAngle)
  const outerEnd = polarToCart(cx, cy, outerR, endAngle)
  const innerStart = polarToCart(cx, cy, innerR, endAngle)
  const innerEnd = polarToCart(cx, cy, innerR, startAngle)

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ")
}

type ArcSegment = {
  node: WeightedNode
  startAngle: number
  endAngle: number
  midAngle: number
}

type GroupArc = {
  group: string
  startAngle: number
  endAngle: number
  totalWeight: number
}

function buildLayout(weighted: WeightedNode[]) {
  const totalWeight = weighted.reduce((sum, n) => sum + Math.max(n.weight, 1), 0)
  if (totalWeight === 0) return { segments: [], groupArcs: [] }

  // Outer ring: individual node arcs
  const segments: ArcSegment[] = []
  let angle = -Math.PI / 2
  const GAP = 0.01

  for (const node of weighted) {
    const sweep = ((Math.max(node.weight, 1)) / totalWeight) * (2 * Math.PI - GAP * weighted.length)
    segments.push({
      node,
      startAngle: angle,
      endAngle: angle + sweep,
      midAngle: angle + sweep / 2,
    })
    angle += sweep + GAP
  }

  // Inner ring: group summary arcs
  const groupWeights = new Map<string, number>()
  for (const node of weighted) {
    groupWeights.set(node.group, (groupWeights.get(node.group) ?? 0) + Math.max(node.weight, 1))
  }

  const groupArcs: GroupArc[] = []
  let gAngle = -Math.PI / 2

  for (const group of GROUP_ORDER) {
    const w = groupWeights.get(group)
    if (!w) continue
    const sweep = (w / totalWeight) * (2 * Math.PI - GAP * groupWeights.size)
    groupArcs.push({
      group,
      startAngle: gAngle,
      endAngle: gAngle + sweep,
      totalWeight: w,
    })
    gAngle += sweep + GAP
  }

  // Handle unknown group
  const unknownW = groupWeights.get("unknown")
  if (unknownW) {
    const sweep = (unknownW / totalWeight) * (2 * Math.PI - GAP * groupWeights.size)
    groupArcs.push({
      group: "unknown",
      startAngle: gAngle,
      endAngle: gAngle + sweep,
      totalWeight: unknownW,
    })
  }

  return { segments, groupArcs }
}

export default function PieChartView({ graph, filter, fills }: PieChartViewProps) {
  const f = fills ?? GROUP_FILL
  const weighted = useMemo(
    () => computeNodeWeights(graph, filter),
    [graph, filter],
  )

  const { segments, groupArcs } = useMemo(
    () => buildLayout(weighted),
    [weighted],
  )

  const {
    selectedNodeId,
    highlightedNodeIds,
    selectNode,
    setHighlights,
  } = useGraphInteraction()

  function handleClick(node: WeightedNode) {
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
  const selectedNode = weighted.find((n) => n.id === selectedNodeId)

  return (
    <svg
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      className="w-full max-h-[600px] rounded-xl"
      role="img"
      aria-label="Pie chart visualization"
    >
      {/* Inner ring: group arcs */}
      {groupArcs.map((ga) => (
        <path
          key={`group-${ga.group}`}
          d={arcPath(CENTER, CENTER, INNER_R, INNER_INNER_R, ga.startAngle, ga.endAngle)}
          fill={f[ga.group] ?? f.unknown ?? "#6b6b80"}
          opacity={0.3}
          stroke="#111114"
          strokeWidth={1}
        />
      ))}

      {/* Outer ring: node arcs */}
      {segments.map((seg) => {
        const isSelected = seg.node.id === selectedNodeId
        const isNeighbor = highlightedNodeIds.includes(seg.node.id)

        const opacity = hasSelection
          ? isSelected
            ? 1
            : isNeighbor
            ? 0.8
            : 0.25
          : 0.85

        return (
          <path
            key={seg.node.id}
            d={arcPath(CENTER, CENTER, OUTER_R, OUTER_INNER_R, seg.startAngle, seg.endAngle)}
            fill={f[seg.node.group] ?? f.unknown ?? "#6b6b80"}
            opacity={opacity}
            stroke={isSelected ? "#8b5cf6" : "#111114"}
            strokeWidth={isSelected ? 2 : 1}
            className="cursor-pointer transition-opacity"
            onClick={() => handleClick(seg.node)}
            role="button"
            aria-label={`${seg.node.label} (${seg.node.group}, weight ${seg.node.weight})`}
          />
        )
      })}

      {/* Center label */}
      {selectedNode ? (
        <>
          <text
            x={CENTER}
            y={CENTER - 8}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={14}
            fontWeight={600}
            fill="#e8e8ed"
            className="select-none"
          >
            {selectedNode.label}
          </text>
          <text
            x={CENTER}
            y={CENTER + 12}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fill="#6b6b80"
            className="select-none"
          >
            {GROUP_LABELS[selectedNode.group] ?? selectedNode.group} &middot; weight {selectedNode.weight}
          </text>
        </>
      ) : (
        <text
          x={CENTER}
          y={CENTER}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fill="#6b6b80"
          className="select-none"
        >
          Click a segment
        </text>
      )}
    </svg>
  )
}
