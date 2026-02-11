"use client"

import { useMemo } from "react"
import { GraphData } from "@/lib/graph/types"
import { computeNodeWeights, WeightedNode } from "@/lib/graph/weights"
import { useGraphInteraction } from "@/lib/graph/interactionStore"
import { getNeighborIds } from "@/lib/graph/neighbors"

type WordCloudViewProps = {
  graph: GraphData
  filter: string[]
}

const GROUP_FILL: Record<string, string> = {
  actor: "#3b82f6",
  activity: "#f59e0b",
  tag: "#10b981",
  unknown: "#a3a3a3",
}

const GROUP_ORDER: Record<string, number> = {
  actor: 0,
  activity: 1,
  tag: 2,
  unknown: 3,
}

const MIN_FONT = 14
const MAX_FONT = 52
const SVG_SIZE = 600
const CENTER = SVG_SIZE / 2

type LayoutItem = {
  node: WeightedNode
  x: number
  y: number
  fontSize: number
  ring: number
}

function getFontSize(weight: number, maxWeight: number): number {
  if (maxWeight <= 0) return MIN_FONT
  return MIN_FONT + (weight / maxWeight) * (MAX_FONT - MIN_FONT)
}

function estimateTextWidth(label: string, fontSize: number): number {
  return label.length * fontSize * 0.55
}

function layoutRings(
  weighted: WeightedNode[],
  maxWeight: number,
  selectedNodeId: string | undefined,
  graph: GraphData,
): { items: LayoutItem[]; ringCount: number } {
  if (weighted.length === 0) return { items: [], ringCount: 0 }

  const nodeMap = new Map(weighted.map((n) => [n.id, n]))

  // Determine center node and ordering
  let centerNode: WeightedNode
  let remaining: WeightedNode[]

  if (selectedNodeId && nodeMap.has(selectedNodeId)) {
    centerNode = nodeMap.get(selectedNodeId)!
    const neighborIds = new Set(getNeighborIds(graph, selectedNodeId))
    const neighbors = weighted
      .filter((n) => n.id !== selectedNodeId && neighborIds.has(n.id))
      .sort((a, b) => b.weight - a.weight)
    const others = weighted
      .filter((n) => n.id !== selectedNodeId && !neighborIds.has(n.id))
      .sort((a, b) => b.weight - a.weight)
    remaining = [...neighbors, ...others]
  } else {
    centerNode = weighted[0]
    remaining = weighted.slice(1)
  }

  const items: LayoutItem[] = []

  // Place center node
  const centerFontSize = getFontSize(centerNode.weight, maxWeight)
  items.push({
    node: centerNode,
    x: CENTER,
    y: CENTER,
    fontSize: centerFontSize,
    ring: 0,
  })

  if (remaining.length === 0) return { items, ringCount: 0 }

  // Distribute remaining nodes into rings
  const MIN_RING_RADIUS = 70
  const RING_GAP = 65
  let ringIndex = 1
  let cursor = 0

  while (cursor < remaining.length) {
    const radius = MIN_RING_RADIUS + (ringIndex - 1) * RING_GAP
    const circumference = 2 * Math.PI * radius
    const MIN_ARC_GAP = 12

    // Figure out how many nodes fit on this ring
    let usedArc = 0
    const ringNodes: { node: WeightedNode; fontSize: number; arcNeeded: number }[] = []

    for (let i = cursor; i < remaining.length; i++) {
      const node = remaining[i]
      const fontSize = getFontSize(node.weight, maxWeight)
      const textW = estimateTextWidth(node.label, fontSize)
      const arcNeeded = textW + MIN_ARC_GAP

      if (usedArc + arcNeeded > circumference && ringNodes.length > 0) break

      ringNodes.push({ node, fontSize, arcNeeded })
      usedArc += arcNeeded
    }

    // Sort within ring by group for color clustering
    ringNodes.sort(
      (a, b) =>
        (GROUP_ORDER[a.node.group] ?? 3) - (GROUP_ORDER[b.node.group] ?? 3),
    )

    // Place nodes evenly around the ring
    const totalArc = ringNodes.reduce((s, r) => s + r.arcNeeded, 0)
    const extraSpace = Math.max(0, circumference - totalArc)
    const padding = ringNodes.length > 0 ? extraSpace / ringNodes.length : 0

    let angle = -Math.PI / 2
    for (const { node, fontSize, arcNeeded } of ringNodes) {
      const halfArc = (arcNeeded + padding) / 2
      const midAngle = angle + halfArc / radius

      items.push({
        node,
        x: CENTER + radius * Math.cos(midAngle),
        y: CENTER + radius * Math.sin(midAngle),
        fontSize,
        ring: ringIndex,
      })

      angle = midAngle + halfArc / radius
    }

    cursor += ringNodes.length
    ringIndex++
  }

  return { items, ringCount: ringIndex - 1 }
}

export default function WordCloudView({ graph, filter }: WordCloudViewProps) {
  const weighted = useMemo(
    () => computeNodeWeights(graph, filter),
    [graph, filter],
  )

  const maxWeight = weighted[0]?.weight ?? 1

  const {
    selectedNodeId,
    highlightedNodeIds,
    selectNode,
    setHighlights,
  } = useGraphInteraction()

  const { items, ringCount } = useMemo(
    () => layoutRings(weighted, maxWeight, selectedNodeId, graph),
    [weighted, maxWeight, selectedNodeId, graph],
  )

  // Ring guide radii
  const ringRadii = useMemo(() => {
    const radii: number[] = []
    for (let i = 1; i <= ringCount; i++) {
      radii.push(70 + (i - 1) * 65)
    }
    return radii
  }, [ringCount])

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
      <p className="text-sm text-neutral-400 py-8 text-center">
        No nodes match the current filter.
      </p>
    )
  }

  const hasSelection = !!selectedNodeId

  return (
    <svg
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      className="w-full max-h-[600px]"
      role="img"
      aria-label="Word cloud visualization"
    >
      {/* Glow filter for selected node */}
      <defs>
        <filter id="cloud-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
          <feFlood floodColor="#171717" floodOpacity="0.15" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ring guide circles */}
      {ringRadii.map((r, i) => (
        <circle
          key={`ring-${i}`}
          cx={CENTER}
          cy={CENTER}
          r={r}
          fill="none"
          stroke="#e5e5e5"
          strokeWidth={0.75}
          strokeDasharray="4,6"
          opacity={0.5}
        />
      ))}

      {/* Word labels */}
      {items.map(({ node, x, y, fontSize }) => {
        const isSelected = node.id === selectedNodeId
        const isNeighbor = highlightedNodeIds.includes(node.id)

        const opacity = hasSelection
          ? isSelected
            ? 1
            : isNeighbor
            ? 0.85
            : 0.3
          : 0.9

        return (
          <text
            key={node.id}
            x={0}
            y={0}
            fontSize={fontSize}
            fill={GROUP_FILL[node.group] ?? GROUP_FILL.unknown}
            fontWeight={isSelected ? 700 : 400}
            textAnchor="middle"
            dominantBaseline="central"
            className="cursor-pointer select-none"
            style={{
              transform: `translate(${x}px, ${y}px)`,
              transition: "transform 300ms ease-out, opacity 200ms ease",
              opacity,
              filter: isSelected ? "url(#cloud-glow)" : undefined,
            }}
            onClick={() => handleClick(node)}
            role="button"
            aria-label={`${node.label} (${node.group}, weight ${node.weight})`}
          >
            {node.label}
          </text>
        )
      })}
    </svg>
  )
}
