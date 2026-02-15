"use client"

import { useMemo, useState } from "react"
import { GraphData } from "@/lib/graph/types"
import { computeNodeWeights, WeightedNode } from "@/lib/graph/weights"
import { useGraphInteraction } from "@/lib/graph/interactionStore"
import { getNeighborIds } from "@/lib/graph/neighbors"
import { GROUP_FILL, GROUP_ORDER, GROUP_LABELS } from "@/lib/graph/colors"
import { HeatmapSettings, DEFAULT_HEATMAP } from "@/lib/graph/viewSettings"

type HeatmapViewProps = {
  graph: GraphData
  filter: string[]
  settings?: HeatmapSettings
  fills?: Record<string, string>
}

const SVG_SIZE = 600

export default function HeatmapView({ graph, filter, settings, fills }: HeatmapViewProps) {
  const s = settings ?? DEFAULT_HEATMAP
  const f = fills ?? GROUP_FILL
  const LABEL_MARGIN = s.labelMargin
  const MAX_NODES = s.maxNodes
  const [hoveredCell, setHoveredCell] = useState<{
    row: number
    col: number
  } | null>(null)

  const {
    selectedNodeId,
    highlightedNodeIds,
    selectNode,
    setHighlights,
  } = useGraphInteraction()

  const weighted = useMemo(
    () => computeNodeWeights(graph, filter),
    [graph, filter],
  )

  const { sortedNodes, adj, groupBoundaries } = useMemo(() => {
    const top = weighted.slice(0, MAX_NODES)

    const sorted = [...top].sort((a, b) => {
      const ga = GROUP_ORDER[a.group] ?? GROUP_ORDER.unknown
      const gb = GROUP_ORDER[b.group] ?? GROUP_ORDER.unknown
      if (ga !== gb) return ga - gb
      return b.weight - a.weight
    })

    const nodeIdSet = new Set(sorted.map((n) => n.id))

    const adjacency = new Map<string, Set<string>>()
    for (const edge of graph.edges) {
      if (!nodeIdSet.has(edge.source) || !nodeIdSet.has(edge.target)) continue
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set())
      if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set())
      adjacency.get(edge.source)!.add(edge.target)
      adjacency.get(edge.target)!.add(edge.source)
    }

    // Compute group boundaries for separator lines
    const cellSize = sorted.length > 0
      ? (SVG_SIZE - LABEL_MARGIN) / sorted.length
      : 0
    const boundaries: number[] = []
    let prevGroup: string | null = null
    for (let i = 0; i < sorted.length; i++) {
      const group = sorted[i].group
      if (prevGroup !== null && group !== prevGroup) {
        boundaries.push(LABEL_MARGIN + i * cellSize)
      }
      prevGroup = group
    }

    return { sortedNodes: sorted, adj: adjacency, groupBoundaries: boundaries }
  }, [weighted, graph.edges])

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

  const gridSize = SVG_SIZE - LABEL_MARGIN
  const cellSize = sortedNodes.length > 0 ? gridSize / sortedNodes.length : 0
  const hasSelection = !!selectedNodeId

  return (
    <svg
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      className="w-full max-h-[600px]"
      role="img"
      aria-label="Adjacency matrix heatmap visualization"
      onMouseLeave={() => setHoveredCell(null)}
    >
      {/* Grid background */}
      <rect
        x={LABEL_MARGIN}
        y={LABEL_MARGIN}
        width={gridSize}
        height={gridSize}
        fill="#111114"
      />

      {/* Filled cells (only where edges exist) */}
      {sortedNodes.map((rowNode, ri) =>
        sortedNodes.map((colNode, ci) => {
          const hasEdge = adj.get(rowNode.id)?.has(colNode.id) ?? false
          if (!hasEdge) return null

          const rowSelected = rowNode.id === selectedNodeId
          const colSelected = colNode.id === selectedNodeId
          const rowIsNeighbor = highlightedNodeIds.includes(rowNode.id)
          const colIsNeighbor = highlightedNodeIds.includes(colNode.id)

          const opacity = hasSelection
            ? rowSelected || colSelected
              ? 0.9
              : rowIsNeighbor || colIsNeighbor
                ? 0.6
                : 0.15
            : 0.7

          return (
            <rect
              key={`${rowNode.id}-${colNode.id}`}
              x={LABEL_MARGIN + ci * cellSize}
              y={LABEL_MARGIN + ri * cellSize}
              width={cellSize}
              height={cellSize}
              fill={f[rowNode.group] ?? f.unknown ?? "#6b6b80"}
              opacity={opacity}
              className="cursor-pointer transition-opacity"
              onMouseEnter={() => setHoveredCell({ row: ri, col: ci })}
              onClick={() => handleClick(rowNode)}
            />
          )
        }),
      )}

      {/* Group separator lines */}
      {groupBoundaries.map((boundary, i) => (
        <g key={`sep-${i}`}>
          <line
            x1={LABEL_MARGIN}
            y1={boundary}
            x2={SVG_SIZE}
            y2={boundary}
            stroke="#1e1e24"
            strokeWidth={1}
          />
          <line
            x1={boundary}
            y1={LABEL_MARGIN}
            x2={boundary}
            y2={SVG_SIZE}
            stroke="#1e1e24"
            strokeWidth={1}
          />
        </g>
      ))}

      {/* Row labels (left side) */}
      {sortedNodes.map((node, i) => {
        const isSelected = node.id === selectedNodeId
        return (
          <text
            key={`row-${node.id}`}
            x={LABEL_MARGIN - 4}
            y={LABEL_MARGIN + i * cellSize + cellSize / 2}
            textAnchor="end"
            dominantBaseline="central"
            fontSize={Math.min(cellSize * 0.8, 9)}
            fontWeight={isSelected ? 700 : 400}
            fill={isSelected ? "#e8e8ed" : "#6b6b80"}
            className="select-none cursor-pointer"
            onClick={() => handleClick(node)}
          >
            {node.label}
          </text>
        )
      })}

      {/* Column labels (top, rotated) */}
      {sortedNodes.map((node, i) => {
        const isSelected = node.id === selectedNodeId
        return (
          <text
            key={`col-${node.id}`}
            transform={`translate(${LABEL_MARGIN + i * cellSize + cellSize / 2}, ${LABEL_MARGIN - 4}) rotate(-45)`}
            textAnchor="start"
            dominantBaseline="central"
            fontSize={Math.min(cellSize * 0.8, 9)}
            fontWeight={isSelected ? 700 : 400}
            fill={isSelected ? "#e8e8ed" : "#6b6b80"}
            className="select-none cursor-pointer"
            onClick={() => handleClick(node)}
          >
            {node.label}
          </text>
        )
      })}

      {/* Hover crosshair overlays */}
      {hoveredCell !== null && (
        <g pointerEvents="none">
          {/* Row highlight */}
          <rect
            x={LABEL_MARGIN}
            y={LABEL_MARGIN + hoveredCell.row * cellSize}
            width={gridSize}
            height={cellSize}
            fill="#e8e8ed"
            opacity={0.06}
          />
          {/* Column highlight */}
          <rect
            x={LABEL_MARGIN + hoveredCell.col * cellSize}
            y={LABEL_MARGIN}
            width={cellSize}
            height={gridSize}
            fill="#e8e8ed"
            opacity={0.06}
          />
        </g>
      )}
    </svg>
  )
}
