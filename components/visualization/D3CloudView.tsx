"use client"

import { useMemo, useEffect, useState } from "react"
import { GraphData } from "@/lib/graph/types"
import { computeNodeWeights, WeightedNode } from "@/lib/graph/weights"
import { useGraphInteraction } from "@/lib/graph/interactionStore"
import { getNeighborIds } from "@/lib/graph/neighbors"
import { GROUP_FILL, GROUP_LABELS } from "@/lib/graph/colors"
import { D3CloudSettings, DEFAULT_D3CLOUD } from "@/lib/graph/viewSettings"
import d3Cloud from "d3-cloud"

type D3CloudViewProps = {
  graph: GraphData
  filter: string[]
  settings?: D3CloudSettings
  fills?: Record<string, string>
  fontFamily?: string
}

const SVG_SIZE = 600
const CENTER = SVG_SIZE / 2

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

export default function D3CloudView({ graph, filter, settings, fills, fontFamily }: D3CloudViewProps) {
  const s = settings ?? DEFAULT_D3CLOUD
  const f = fills ?? GROUP_FILL
  const ff = fontFamily ?? "sans-serif"
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
      return
    }

    const layout = d3Cloud<CloudWord>()
      .size([SVG_SIZE, SVG_SIZE])
      .words(cloudInput.map((w) => ({ ...w })))
      .padding(s.wordPadding)
      .spiral("archimedean")
      .font(ff)
      .fontSize((d) => d.size!)
      .rotate(() => (Math.random() > 0.5 ? 90 : 0))
      .on("end", (words) => {
        setLayoutWords(
          words.map((w) => {
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
          }),
        )
      })

    layout.start()
  }, [cloudInput, s, ff])

  // Build a lookup from nodeId -> WeightedNode for click handler
  const nodeMap = useMemo(() => {
    const map = new Map<string, WeightedNode>()
    weighted.forEach((n) => map.set(n.id, n))
    return map
  }, [weighted])

  function handleClick(word: LayoutWord) {
    const node = nodeMap.get(word.nodeId)
    if (!node) return

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

  return (
    <svg
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      className="w-full max-h-[600px]"
      role="img"
      aria-label="D3 word cloud visualization"
    >
      <defs>
        <filter id="d3cloud-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
          <feFlood floodColor="#8b5cf6" floodOpacity="0.25" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform={`translate(${CENTER},${CENTER})`}>
        {layoutWords.map((word) => {
          const isSelected = word.nodeId === selectedNodeId
          const isNeighbor = highlightedNodeIds.includes(word.nodeId)

          const opacity = hasSelection
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
              fill={f[word.group] ?? f.unknown ?? "#6b6b80"}
              fontWeight={isSelected ? 700 : 400}
              fontFamily={ff}
              textAnchor="middle"
              dominantBaseline="central"
              className="cursor-pointer select-none"
              style={{
                transition: "opacity 200ms ease",
                opacity,
                filter: isSelected ? "url(#d3cloud-glow)" : undefined,
              }}
              onClick={() => handleClick(word)}
              role="button"
              aria-label={`${word.text} (${GROUP_LABELS[word.group] ?? word.group}, weight ${word.weight})`}
            >
              {word.text}
            </text>
          )
        })}
      </g>
    </svg>
  )
}
