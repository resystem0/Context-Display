"use client"

import { useMemo, useEffect, useState, useRef, useCallback } from "react"
import { GraphData } from "@/lib/graph/types"
import { computeNodeWeights, WeightedNode } from "@/lib/graph/weights"
import { useGraphInteraction } from "@/lib/graph/interactionStore"
import { getNeighborIds } from "@/lib/graph/neighbors"
import { GROUP_FILL } from "@/lib/graph/colors"
import { AnimatedSettings, DEFAULT_ANIMATED } from "@/lib/graph/viewSettings"
import d3Cloud from "d3-cloud"

type AnimatedCloudViewProps = {
  graph: GraphData
  filter: string[]
  autoPlay?: boolean
  settings?: AnimatedSettings
}

const SVG_SIZE = 600
const CENTER = SVG_SIZE / 2
const ENTRANCE_INTERVAL = 50 // ms between each word appearing
const ENTRANCE_DURATION = 400 // ms for fade-in + scale transition

const MANUAL_PAUSE_DURATION = 10000

// Gradient color pairs: [lighter, darker] per group
const GRADIENT_COLORS: Record<string, [string, string]> = {
  actor: ["#3b82f6", "#60a5fa"],
  activity: ["#f59e0b", "#fbbf24"],
  tag: ["#10b981", "#34d399"],
  unknown: ["#a3a3a3", "#d4d4d4"],
}

type CloudWord = {
  text: string
  size: number
  nodeId: string
  group: string
  weight: number
}

type LayoutWord = CloudWord & {
  x: number
  y: number
  rotate: number
}

export default function AnimatedCloudView({
  graph,
  filter,
  autoPlay = false,
  settings,
}: AnimatedCloudViewProps) {
  const s = settings ?? DEFAULT_ANIMATED
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

  const [layoutWords, setLayoutWords] = useState<LayoutWord[]>([])
  const [visibleCount, setVisibleCount] = useState(0)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  // Auto-cycle state
  const [cycleIndex, setCycleIndex] = useState(0)
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const manualPauseRef = useRef<NodeJS.Timeout | null>(null)
  const isPausedRef = useRef(false)

  // Build input words for d3-cloud
  const cloudInput = useMemo<CloudWord[]>(
    () =>
      weighted.map((n) => {
        const maxW = maxWeight <= 0 ? 1 : maxWeight
        return {
          text: n.label,
          size: s.minFont + (n.weight / maxW) * (s.maxFont - s.minFont),
          nodeId: n.id,
          group: n.group,
          weight: n.weight,
        }
      }),
    [weighted, maxWeight, s.minFont, s.maxFont],
  )

  // Run d3-cloud layout
  useEffect(() => {
    if (cloudInput.length === 0) {
      setLayoutWords([])
      setVisibleCount(0)
      return
    }

    const layout = d3Cloud<CloudWord>()
      .size([SVG_SIZE, SVG_SIZE])
      .words(cloudInput.map((w) => ({ ...w })))
      .padding(s.wordPadding)
      .spiral("archimedean")
      .font("sans-serif")
      .fontSize((d) => d.size!)
      .rotate(() => (Math.random() > 0.5 ? 90 : 0))
      .on("end", (words) => {
        // Sort by weight descending so highest-weight words appear first
        const sorted = words
          .map((w) => {
            const cw = w as CloudWord & { x: number; y: number; rotate: number }
            return {
              text: cw.text!,
              size: cw.size!,
              nodeId: cw.nodeId,
              group: cw.group,
              weight: cw.weight,
              x: cw.x,
              y: cw.y,
              rotate: cw.rotate,
            }
          })
          .sort((a, b) => b.weight - a.weight)

        setLayoutWords(sorted)
        setVisibleCount(0) // Reset entrance animation
      })

    layout.start()
  }, [cloudInput, s])

  // Staggered entrance animation: increment visibleCount one by one
  useEffect(() => {
    if (visibleCount >= layoutWords.length) return

    const timer = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= layoutWords.length) {
          clearInterval(timer)
          return prev
        }
        return prev + 1
      })
    }, ENTRANCE_INTERVAL)

    return () => clearInterval(timer)
  }, [layoutWords, visibleCount])

  // Build a lookup from nodeId -> WeightedNode
  const nodeMap = useMemo(() => {
    const map = new Map<string, WeightedNode>()
    weighted.forEach((n) => map.set(n.id, n))
    return map
  }, [weighted])

  // Auto-cycle through nodes
  const cycleToNextNode = useCallback(() => {
    if (weighted.length === 0) return
    const nextIndex = (cycleIndex + 1) % weighted.length
    const nextNode = weighted[nextIndex]
    selectNode(nextNode.id)
    setHighlights(getNeighborIds(graph, nextNode.id))
    setCycleIndex(nextIndex)
  }, [weighted, cycleIndex, selectNode, setHighlights, graph])

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

  function handleClick(word: LayoutWord) {
    const node = nodeMap.get(word.nodeId)
    if (!node) return

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

  // Find hovered word for tooltip
  const hoveredWord = hoveredNodeId
    ? layoutWords.find((w) => w.nodeId === hoveredNodeId)
    : null
  const hoveredNode = hoveredNodeId ? nodeMap.get(hoveredNodeId) : null
  const hoveredNeighborCount = hoveredNodeId
    ? getNeighborIds(graph, hoveredNodeId).length
    : 0

  return (
    <svg
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      className="w-full max-h-[600px]"
      role="img"
      aria-label="Animated word cloud visualization"
    >
      <defs>
        {/* Gradient fills per group */}
        {Object.entries(GRADIENT_COLORS).map(([group, [from, to]]) => (
          <linearGradient
            key={group}
            id={`gradient-${group}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        ))}

        {/* Glow filter for selected node */}
        <filter
          id="animated-cloud-glow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
          <feFlood floodColor="#171717" floodOpacity="0.15" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform={`translate(${CENTER},${CENTER})`}>
        {layoutWords.map((word, index) => {
          const isVisible = index < visibleCount
          const isSelected = word.nodeId === selectedNodeId
          const isNeighbor = highlightedNodeIds.includes(word.nodeId)

          const finalOpacity = hasSelection
            ? isSelected
              ? 1
              : isNeighbor
              ? 0.85
              : 0.3
            : 0.9

          return (
            <text
              key={word.nodeId}
              transform={`translate(${word.x},${word.y}) rotate(${word.rotate})`}
              fontSize={word.size}
              fill={`url(#gradient-${word.group in GRADIENT_COLORS ? word.group : "unknown"})`}
              fontWeight={isSelected ? 700 : 400}
              fontFamily="sans-serif"
              textAnchor="middle"
              dominantBaseline="central"
              className="cursor-pointer select-none"
              style={{
                opacity: isVisible ? finalOpacity : 0,
                transform: `translate(${word.x}px, ${word.y}px) rotate(${word.rotate}deg) scale(${isVisible ? 1 : 0.3})`,
                transition: `opacity ${ENTRANCE_DURATION}ms ease-out, transform ${ENTRANCE_DURATION}ms ease-out`,
                filter: isSelected
                  ? "url(#animated-cloud-glow)"
                  : undefined,
              }}
              onClick={() => handleClick(word)}
              onMouseEnter={() => setHoveredNodeId(word.nodeId)}
              onMouseLeave={() => setHoveredNodeId(null)}
              role="button"
              aria-label={`${word.text} (${word.group}, weight ${word.weight})`}
            >
              {word.text}
            </text>
          )
        })}

        {/* Tooltip */}
        {hoveredWord && hoveredNode && (
          <g
            transform={`translate(${hoveredWord.x},${hoveredWord.y - hoveredWord.size / 2 - 20})`}
            pointerEvents="none"
          >
            <rect
              x={-90}
              y={-52}
              width={180}
              height={56}
              rx={6}
              ry={6}
              fill="rgba(23, 23, 23, 0.92)"
              stroke="rgba(64, 64, 64, 0.5)"
              strokeWidth={1}
            />
            <text
              x={0}
              y={-36}
              textAnchor="middle"
              fill="#ffffff"
              fontSize={11}
              fontWeight={700}
              fontFamily="sans-serif"
            >
              {hoveredNode.label}
            </text>
            <text
              x={0}
              y={-22}
              textAnchor="middle"
              fill="#a3a3a3"
              fontSize={10}
              fontFamily="sans-serif"
            >
              {hoveredNode.group}
            </text>
            <text
              x={0}
              y={-8}
              textAnchor="middle"
              fill="#a3a3a3"
              fontSize={10}
              fontFamily="sans-serif"
            >
              weight: {hoveredWord.weight} | neighbors: {hoveredNeighborCount}
            </text>
          </g>
        )}
      </g>
    </svg>
  )
}
