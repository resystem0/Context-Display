"use client"

import { useMemo, useEffect, useRef, useState, useCallback } from "react"
import { GraphData } from "@/lib/graph/types"
import { computeNodeWeights, WeightedNode } from "@/lib/graph/weights"
import { useGraphInteraction } from "@/lib/graph/interactionStore"
import { getNeighborIds } from "@/lib/graph/neighbors"
import { GROUP_FILL, GROUP_ORDER } from "@/lib/graph/colors"
import { CloudSettings, DEFAULT_CLOUD } from "@/lib/graph/viewSettings"

type WordCloudViewProps = {
  graph: GraphData
  filter: string[]
  autoPlay?: boolean
  settings?: CloudSettings
}

// defaults now in viewSettings.ts
const SVG_SIZE = 600
const CENTER = SVG_SIZE / 2

const MANUAL_PAUSE_DURATION = 10000 // 10 seconds pause after manual click

type LayoutItem = {
  node: WeightedNode
  x: number
  y: number
  fontSize: number
  ring: number
}

function getFontSize(weight: number, maxWeight: number, minFont: number, maxFont: number): number {
  if (maxWeight <= 0) return minFont
  return minFont + (weight / maxWeight) * (maxFont - minFont)
}

function estimateTextWidth(label: string, fontSize: number): number {
  return label.length * fontSize * 0.55
}

function layoutRings(
  weighted: WeightedNode[],
  maxWeight: number,
  selectedNodeId: string | undefined,
  graph: GraphData,
  rotationOffset: number = 0,
  minFont: number = 14,
  maxFont: number = 52,
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
  const centerFontSize = getFontSize(centerNode.weight, maxWeight, minFont, maxFont)
  items.push({
    node: centerNode,
    x: CENTER,
    y: CENTER,
    fontSize: centerFontSize,
    ring: 0,
  })

  if (remaining.length === 0) return { items, ringCount: 0 }

  // Convert rotation offset to radians
  const rotationRad = (rotationOffset * Math.PI) / 180

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
      const fontSize = getFontSize(node.weight, maxWeight, minFont, maxFont)
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

    // Start angle includes rotation offset
    let angle = -Math.PI / 2 + rotationRad
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

export default function WordCloudView({ graph, filter, autoPlay = false, settings }: WordCloudViewProps) {
  const s = settings ?? DEFAULT_CLOUD
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

  // Rotation animation state
  const [rotationOffset, setRotationOffset] = useState(0)
  const animationRef = useRef<number | null>(null)

  // Auto-cycle state
  const [cycleIndex, setCycleIndex] = useState(0)
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const manualPauseRef = useRef<NodeJS.Timeout | null>(null)
  const isPausedRef = useRef(false)

  // Auto-cycle through nodes
  const cycleToNextNode = useCallback(() => {
    if (weighted.length === 0) return
    const nextIndex = (cycleIndex + 1) % weighted.length
    const nextNode = weighted[nextIndex]
    selectNode(nextNode.id)
    setHighlights(getNeighborIds(graph, nextNode.id))
    setCycleIndex(nextIndex)
  }, [weighted, cycleIndex, selectNode, setHighlights, graph])

  // Ring rotation animation loop
  useEffect(() => {
    if (!autoPlay) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    const animate = () => {
      setRotationOffset((prev) => (prev + s.rotationSpeed) % 360)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [autoPlay, s.rotationSpeed])

  // Auto-cycle timer
  useEffect(() => {
    if (!autoPlay || isPausedRef.current) {
      if (cycleTimerRef.current) {
        clearInterval(cycleTimerRef.current)
        cycleTimerRef.current = null
      }
      return
    }

    cycleTimerRef.current = setInterval(cycleToNextNode, s.cycleInterval)

    return () => {
      if (cycleTimerRef.current) {
        clearInterval(cycleTimerRef.current)
      }
    }
  }, [autoPlay, cycleToNextNode, s.cycleInterval])

  const { items, ringCount } = useMemo(
    () => layoutRings(weighted, maxWeight, selectedNodeId, graph, rotationOffset, s.minFont, s.maxFont),
    [weighted, maxWeight, selectedNodeId, graph, rotationOffset, s.minFont, s.maxFont],
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
    // Pause auto-cycle on manual interaction
    if (autoPlay) {
      isPausedRef.current = true
      if (cycleTimerRef.current) {
        clearInterval(cycleTimerRef.current)
        cycleTimerRef.current = null
      }
      if (manualPauseRef.current) {
        clearTimeout(manualPauseRef.current)
      }
      manualPauseRef.current = setTimeout(() => {
        isPausedRef.current = false
      }, MANUAL_PAUSE_DURATION)
    }

    if (selectedNodeId === node.id) {
      selectNode(undefined)
      setHighlights([])
      return
    }

    // Update cycle index to match clicked node
    const nodeIndex = weighted.findIndex((w) => w.id === node.id)
    if (nodeIndex >= 0) {
      setCycleIndex(nodeIndex)
    }

    selectNode(node.id)
    setHighlights(getNeighborIds(graph, node.id))
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (manualPauseRef.current) {
        clearTimeout(manualPauseRef.current)
      }
    }
  }, [])

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
              transition: autoPlay ? "opacity 200ms ease" : "transform 300ms ease-out, opacity 200ms ease",
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
