"use client"

import { useMemo } from "react"
import { GraphData } from "@/lib/graph/types"
import { computeNodeWeights, WeightedNode } from "@/lib/graph/weights"
import { useGraphInteraction } from "@/lib/graph/interactionStore"
import { getNeighborIds } from "@/lib/graph/neighbors"

type TreeViewProps = {
  graph: GraphData
  filter: string[]
}

const GROUP_FILL: Record<string, string> = {
  actor: "#3b82f6",
  activity: "#f59e0b",
  tag: "#10b981",
  unknown: "#a3a3a3",
}

const EDGE_DASH: Record<string, string> = {
  authored: "",
  replies_to: "6,3",
  tagged: "2,3",
}

const SVG_SIZE = 550
const CENTER = SVG_SIZE / 2
const MIN_RADIUS = 4
const MAX_RADIUS = 16

function buildRadialLayout(
  weighted: WeightedNode[],
  graph: GraphData,
  selectedNodeId?: string,
) {
  if (weighted.length === 0) return { positions: new Map<string, { x: number; y: number; r: number }>() }

  const maxWeight = weighted[0]?.weight ?? 1
  const nodeSet = new Set(weighted.map((n) => n.id))

  // Find root: selected node if valid, otherwise highest-weight node
  const rootId =
    selectedNodeId && nodeSet.has(selectedNodeId)
      ? selectedNodeId
      : weighted[0].id

  // BFS to assign ring levels
  const levels = new Map<string, number>()
  levels.set(rootId, 0)
  const queue = [rootId]
  let head = 0

  while (head < queue.length) {
    const current = queue[head++]
    const currentLevel = levels.get(current)!
    const neighbors = getNeighborIds(graph, current)
    for (const nId of neighbors) {
      if (!levels.has(nId) && nodeSet.has(nId)) {
        levels.set(nId, currentLevel + 1)
        queue.push(nId)
      }
    }
  }

  // Assign disconnected nodes to the outermost ring + 1
  const maxLevel = Math.max(0, ...Array.from(levels.values()))
  for (const node of weighted) {
    if (!levels.has(node.id)) {
      levels.set(node.id, maxLevel + 1)
    }
  }

  const totalLevels = Math.max(1, ...Array.from(levels.values()))
  const ringGap = Math.min(100, (CENTER - 40) / (totalLevels + 1))

  // Group nodes by level and place them
  const byLevel = new Map<number, WeightedNode[]>()
  for (const node of weighted) {
    const lvl = levels.get(node.id) ?? totalLevels
    if (!byLevel.has(lvl)) byLevel.set(lvl, [])
    byLevel.get(lvl)!.push(node)
  }

  const positions = new Map<string, { x: number; y: number; r: number }>()

  for (const [level, nodes] of byLevel) {
    if (level === 0) {
      const w = nodes[0].weight
      const r = maxWeight > 0
        ? MIN_RADIUS + (w / maxWeight) * (MAX_RADIUS - MIN_RADIUS)
        : MIN_RADIUS
      positions.set(nodes[0].id, { x: CENTER, y: CENTER, r })
      continue
    }

    const ringR = ringGap * level
    const angleStep = (2 * Math.PI) / nodes.length
    const startAngle = -Math.PI / 2

    nodes.forEach((node, i) => {
      const angle = startAngle + i * angleStep
      const r = maxWeight > 0
        ? MIN_RADIUS + (node.weight / maxWeight) * (MAX_RADIUS - MIN_RADIUS)
        : MIN_RADIUS
      positions.set(node.id, {
        x: CENTER + ringR * Math.cos(angle),
        y: CENTER + ringR * Math.sin(angle),
        r,
      })
    })
  }

  return { positions }
}

export default function TreeView({ graph, filter }: TreeViewProps) {
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

  const { positions } = useMemo(
    () => buildRadialLayout(weighted, graph, selectedNodeId),
    [weighted, graph, selectedNodeId],
  )

  const filteredEdges = useMemo(() => {
    return graph.edges.filter(
      (e) => positions.has(e.source) && positions.has(e.target),
    )
  }, [graph.edges, positions])

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
      aria-label="Tree visualization"
    >
      {/* Edges */}
      {filteredEdges.map((edge) => {
        const src = positions.get(edge.source)!
        const tgt = positions.get(edge.target)!
        const isHighlighted =
          hasSelection &&
          (edge.source === selectedNodeId || edge.target === selectedNodeId)

        return (
          <line
            key={`${edge.source}-${edge.target}`}
            x1={src.x}
            y1={src.y}
            x2={tgt.x}
            y2={tgt.y}
            stroke={isHighlighted ? "#525252" : "#d4d4d4"}
            strokeWidth={isHighlighted ? 1.5 : 0.75}
            strokeDasharray={EDGE_DASH[edge.type ?? ""] ?? ""}
            opacity={hasSelection ? (isHighlighted ? 0.8 : 0.15) : 0.4}
          />
        )
      })}

      {/* Nodes */}
      {weighted.map((node) => {
        const pos = positions.get(node.id)
        if (!pos) return null

        const isSelected = node.id === selectedNodeId
        const isNeighbor = highlightedNodeIds.includes(node.id)

        const opacity = hasSelection
          ? isSelected
            ? 1
            : isNeighbor
            ? 0.85
            : 0.2
          : 0.9

        return (
          <g
            key={node.id}
            onClick={() => handleClick(node)}
            className="cursor-pointer"
            role="button"
            aria-label={`${node.label} (${node.group}, weight ${node.weight})`}
          >
            <circle
              cx={pos.x}
              cy={pos.y}
              r={pos.r}
              fill={GROUP_FILL[node.group] ?? GROUP_FILL.unknown}
              opacity={opacity}
              stroke={isSelected ? "#171717" : "none"}
              strokeWidth={isSelected ? 2 : 0}
            />
            {(isSelected || pos.r >= 8) && (
              <text
                x={pos.x}
                y={pos.y + pos.r + 12}
                textAnchor="middle"
                fontSize={isSelected ? 11 : 9}
                fontWeight={isSelected ? 600 : 400}
                fill="#525252"
                opacity={opacity}
                className="select-none pointer-events-none"
              >
                {node.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
