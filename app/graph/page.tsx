"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useBonfireGraph } from "@/lib/hooks/useBonfireGraph"
import {
  WordListView,
  WordCloudView,
  D3CloudView,
  AnimatedCloudView,
  TreeView,
  ForceGraphView,
  BubblePackView,
  HeatmapView,
  PieChartView,
  FilterBar,
  ViewSwitcher,
  ViewSettings,
} from "@/components/visualization"
import type { ViewMode } from "@/components/visualization"
import { SessionQR } from "@/components/qr/SessionQR"
import { useSessionPolling } from "@/lib/hooks/useSessionPolling"
import { useGraphInteraction } from "@/lib/graph/interactionStore"

function GraphPageInner() {
  const { graph, error, isLoading } = useBonfireGraph()
  const [filter, setFilter] = useState<string[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const autoPlay = useGraphInteraction((s) => s.autoPlay)
  const storeViewMode = useGraphInteraction((s) => s.viewMode)
  const setStoreViewMode = useGraphInteraction((s) => s.setViewMode)
  const viewSettings = useGraphInteraction((s) => s.viewSettings)
  const setViewSettings = useGraphInteraction((s) => s.setViewSettings)
  const viewMode = storeViewMode as ViewMode

  const handleViewChange = (mode: ViewMode) => {
    setStoreViewMode(mode)
  }

  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return ""
    return searchParams.get("session") || crypto.randomUUID()
  })

  useEffect(() => {
    if (!sessionId) return
    if (!searchParams.get("session")) {
      router.replace(`?session=${sessionId}`)
    }
  }, [sessionId, searchParams, router])

  // Create session on server
  useEffect(() => {
    if (!sessionId) return
    fetch(`/api/session/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {})
  }, [sessionId])

  useSessionPolling(sessionId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-400 text-sm">Loading graph data...</div>
      </div>
    )
  }

  if (error || !graph) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 text-sm">
          Failed to load graph data.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {sessionId && <SessionQR sessionId={sessionId} />}

      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Bonfire Visualizer
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {graph.nodes.length} nodes &middot; {graph.edges.length} edges
          {(viewMode === "cloud" || viewMode === "animated") && (
            <span className="ml-2">
              &middot; Auto-Play: {autoPlay ? "ON" : "OFF"}
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <ViewSwitcher value={viewMode} onChange={handleViewChange} />
        <FilterBar active={filter} onChange={setFilter} />
      </div>

      <ViewSettings
        viewMode={viewMode}
        values={viewSettings[viewMode as keyof typeof viewSettings] as Record<string, unknown>}
        onChange={(key, val) => setViewSettings(viewMode, { [key]: val })}
      />

      {viewMode === "list" && <WordListView graph={graph} filter={filter} />}
      {viewMode === "cloud" && <WordCloudView graph={graph} filter={filter} autoPlay={autoPlay} settings={viewSettings.cloud} />}
      {viewMode === "d3cloud" && <D3CloudView graph={graph} filter={filter} settings={viewSettings.d3cloud} />}
      {viewMode === "animated" && <AnimatedCloudView graph={graph} filter={filter} autoPlay={autoPlay} settings={viewSettings.animated} />}
      {viewMode === "tree" && <TreeView graph={graph} filter={filter} settings={viewSettings.tree} />}
      {viewMode === "force" && <ForceGraphView graph={graph} filter={filter} settings={viewSettings.force} />}
      {viewMode === "bubble" && <BubblePackView graph={graph} filter={filter} settings={viewSettings.bubble} />}
      {viewMode === "heatmap" && <HeatmapView graph={graph} filter={filter} settings={viewSettings.heatmap} />}
      {viewMode === "pie" && <PieChartView graph={graph} filter={filter} />}
    </div>
  )
}

export default function GraphPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-neutral-400 text-sm">Loading...</div>
        </div>
      }
    >
      <GraphPageInner />
    </Suspense>
  )
}
