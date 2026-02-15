"use client"

import { useMemo, useEffect, useState, useRef, useCallback } from "react"
import { GraphData } from "@/lib/graph/types"
import { computeNodeWeights, WeightedNode } from "@/lib/graph/weights"
import { useGraphInteraction } from "@/lib/graph/interactionStore"
import { getNeighborIds } from "@/lib/graph/neighbors"
import { GROUP_FILL } from "@/lib/graph/colors"
import { ForceSettings, DEFAULT_FORCE } from "@/lib/graph/viewSettings"
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force"

/* ---------- types ---------- */

interface SimNode extends SimulationNodeDatum {
  id: string
  label: string
  group: string
  weight: number
  radius: number
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string | SimNode
  target: string | SimNode
  type?: string
}

/* ---------- constants ---------- */

const SVG_SIZE = 600
const CENTER = 300
const CLICK_THRESHOLD = 3

/* ---------- component ---------- */

export default function ForceGraphView({
  graph,
  filter,
  settings,
}: {
  graph: GraphData
  filter: string[]
  settings?: ForceSettings
}) {
  const s = settings ?? DEFAULT_FORCE
  const { selectedNodeId, highlightedNodeIds, selectNode, setHighlights } =
    useGraphInteraction()

  const svgRef = useRef<SVGSVGElement>(null)
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(
    null,
  )

  const [nodes, setNodes] = useState<SimNode[]>([])
  const [links, setLinks] = useState<SimLink[]>([])
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)

  /* --- weighted nodes --- */

  const weighted = useMemo(
    () => computeNodeWeights(graph, filter),
    [graph, filter],
  )

  /* --- build simulation on mount / data change --- */

  useEffect(() => {
    if (weighted.length === 0) {
      setNodes([])
      setLinks([])
      return
    }

    const maxWeight = Math.max(...weighted.map((n) => n.weight), 1)

    const simNodes: SimNode[] = weighted.map((n) => ({
      id: n.id,
      label: n.label,
      group: n.group,
      weight: n.weight,
      radius:
        s.minRadius + (n.weight / maxWeight) * (s.maxRadius - s.minRadius),
    }))

    const nodeIds = new Set(simNodes.map((n) => n.id))

    const simLinks: SimLink[] = graph.edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => ({
        source: e.source,
        target: e.target,
        type: e.type,
      }))

    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(s.linkDistance),
      )
      .force("charge", forceManyBody().strength(s.chargeStrength))
      .force("center", forceCenter(CENTER, CENTER))
      .force(
        "collide",
        forceCollide<SimNode>().radius((d) => d.radius + 4),
      )
      .stop()

    sim.tick(300)

    simRef.current = sim

    setNodes([...simNodes])
    setLinks([...simLinks])
  }, [weighted, graph.edges, s])

  /* --- drag handlers --- */

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault()
      dragStartPos.current = { x: e.clientX, y: e.clientY }
      setDraggedNodeId(nodeId)
      setIsDragging(false)

      const sim = simRef.current
      if (!sim) return

      const node = sim.nodes().find((n) => n.id === nodeId)
      if (node) {
        node.fx = node.x
        node.fy = node.y
      }
    },
    [],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!draggedNodeId) return

      const svg = svgRef.current
      const sim = simRef.current
      if (!svg || !sim) return

      setIsDragging(true)

      const pt = svg.createSVGPoint()
      pt.x = e.clientX
      pt.y = e.clientY
      const ctm = svg.getScreenCTM()
      if (!ctm) return
      const svgPt = pt.matrixTransform(ctm.inverse())

      const node = sim.nodes().find((n) => n.id === draggedNodeId)
      if (node) {
        node.fx = svgPt.x
        node.fy = svgPt.y
        sim.alpha(0.3).restart()
        setNodes([...sim.nodes()])
        setLinks((prev) => [...prev])
      }
    },
    [draggedNodeId],
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!draggedNodeId) return

      const sim = simRef.current
      if (sim) {
        const node = sim.nodes().find((n) => n.id === draggedNodeId)
        if (node) {
          node.fx = null
          node.fy = null
        }
        sim.stop()
        setNodes([...sim.nodes()])
      }

      /* click vs drag distinction */
      const start = dragStartPos.current
      if (start) {
        const dx = e.clientX - start.x
        const dy = e.clientY - start.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < CLICK_THRESHOLD) {
          /* treat as click — toggle selection */
          if (selectedNodeId === draggedNodeId) {
            selectNode(undefined)
            setHighlights([])
          } else {
            selectNode(draggedNodeId)
            setHighlights(getNeighborIds(graph, draggedNodeId))
          }
        }
      }

      setDraggedNodeId(null)
      setIsDragging(false)
      dragStartPos.current = null
    },
    [
      draggedNodeId,
      selectedNodeId,
      selectNode,
      setHighlights,
      graph,
    ],
  )

  /* --- selection helpers --- */

  const highlightSet = useMemo(
    () => new Set(highlightedNodeIds),
    [highlightedNodeIds],
  )

  const connectedEdgeSet = useMemo(() => {
    if (!selectedNodeId) return new Set<string>()
    const set = new Set<string>()
    links.forEach((l) => {
      const sId = typeof l.source === "string" ? l.source : l.source.id
      const tId = typeof l.target === "string" ? l.target : l.target.id
      if (sId === selectedNodeId || tId === selectedNodeId) {
        set.add(`${sId}-${tId}`)
      }
    })
    return set
  }, [selectedNodeId, links])

  /* --- empty state --- */

  if (weighted.length === 0) {
    return (
      <p className="text-center text-sm text-neutral-500 py-12">
        No nodes match the current filter.
      </p>
    )
  }

  /* --- render --- */

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      className="w-full h-auto max-h-[600px]"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* edges */}
      {links.map((link, i) => {
        const source = link.source as SimNode
        const target = link.target as SimNode
        const edgeKey = `${source.id}-${target.id}`
        const isConnected = connectedEdgeSet.has(edgeKey)
        const hasSelection = !!selectedNodeId

        return (
          <line
            key={`edge-${i}`}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
            stroke={isConnected ? "#525252" : "#d4d4d4"}
            strokeWidth={isConnected ? 1.5 : 0.75}
            opacity={
              hasSelection ? (isConnected ? 0.8 : 0.15) : 0.5
            }
          />
        )
      })}

      {/* nodes */}
      {nodes.map((node) => {
        const isSelected = node.id === selectedNodeId
        const isNeighbor = highlightSet.has(node.id)
        const hasSelection = !!selectedNodeId

        let opacity = 1
        if (hasSelection) {
          if (isSelected) opacity = 1
          else if (isNeighbor) opacity = 0.85
          else opacity = 0.2
        }

        const showLabel = isSelected || (node.radius >= 10 && s.showLabels)

        return (
          <g key={node.id} style={{ cursor: "grab" }}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill={GROUP_FILL[node.group] ?? GROUP_FILL.unknown}
              opacity={opacity}
              stroke={isSelected ? "#171717" : "none"}
              strokeWidth={isSelected ? 3 : 0}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
            />
            {showLabel && (
              <text
                x={node.x}
                y={(node.y ?? 0) + node.radius + 12}
                textAnchor="middle"
                fontSize={9}
                fill="#525252"
                opacity={opacity}
                pointerEvents="none"
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
