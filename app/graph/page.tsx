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
import { PagePreferences } from "@/components/ui/PagePreferences"
import { useSessionPolling } from "@/lib/hooks/useSessionPolling"
import { useGraphInteraction } from "@/lib/graph/interactionStore"
import { getThemeFills, getThemeGradients, CLOUD_FONTS } from "@/lib/graph/colors"

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
  const pagePrefs = useGraphInteraction((s) => s.pagePrefs)
  const viewMode = storeViewMode as ViewMode

  const handleViewChange = (mode: ViewMode) => {
    setStoreViewMode(mode)
  }

  // Derived theme values
  const fills = getThemeFills(pagePrefs.colorTheme)
  const gradients = getThemeGradients(pagePrefs.colorTheme)
  const cloudFontFamily = CLOUD_FONTS[pagePrefs.cloudFont]

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
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
          <p className="text-muted text-sm tracking-wide">Loading graph...</p>
        </div>
      </div>
    )
  }

  if (error || !graph) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="glass rounded-2xl border border-border px-8 py-6 text-center">
          <p className="text-accent-coral text-sm font-medium">Failed to load graph data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Background image layer */}
      {pagePrefs.background && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${pagePrefs.background})` }}
        >
          <div className="absolute inset-0 bg-background/70" />
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold tracking-tight gradient-text">
              Bonfire Visualizer
            </h1>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted">
              <span className="px-2 py-0.5 rounded-full bg-surface border border-border tabular-nums">
                {graph.nodes.length} nodes
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface border border-border tabular-nums">
                {graph.edges.length} edges
              </span>
              {(viewMode === "cloud" || viewMode === "animated") && (
                <span className={`px-2 py-0.5 rounded-full border ${
                  autoPlay
                    ? "bg-accent-teal/10 border-accent-teal/30 text-accent-teal"
                    : "bg-surface border-border"
                }`}>
                  {autoPlay ? "Auto" : "Paused"}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PagePreferences />
            {sessionId && <SessionQR sessionId={sessionId} />}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-6 space-y-5">
        {/* Controls row */}
        <div className="flex items-center gap-3 flex-wrap">
          <ViewSwitcher value={viewMode} onChange={handleViewChange} />
          <div className="w-px h-6 bg-border" />
          <FilterBar active={filter} onChange={setFilter} />
        </div>

        {/* Settings */}
        <ViewSettings
          viewMode={viewMode}
          values={viewSettings[viewMode as keyof typeof viewSettings] as Record<string, unknown>}
          onChange={(key, val) => setViewSettings(viewMode, { [key]: val })}
        />

        {/* Visualization */}
        <div className="rounded-2xl border border-border bg-surface/50 p-1 min-h-[400px]">
          {viewMode === "list" && <WordListView graph={graph} filter={filter} fills={fills} />}
          {viewMode === "cloud" && <WordCloudView graph={graph} filter={filter} autoPlay={autoPlay} settings={viewSettings.cloud} fills={fills} fontFamily={cloudFontFamily} />}
          {viewMode === "d3cloud" && <D3CloudView graph={graph} filter={filter} settings={viewSettings.d3cloud} fills={fills} fontFamily={cloudFontFamily} />}
          {viewMode === "animated" && <AnimatedCloudView graph={graph} filter={filter} autoPlay={autoPlay} settings={viewSettings.animated} fills={fills} gradients={gradients} fontFamily={cloudFontFamily} />}
          {viewMode === "tree" && <TreeView graph={graph} filter={filter} settings={viewSettings.tree} fills={fills} />}
          {viewMode === "force" && <ForceGraphView graph={graph} filter={filter} settings={viewSettings.force} fills={fills} />}
          {viewMode === "bubble" && <BubblePackView graph={graph} filter={filter} settings={viewSettings.bubble} fills={fills} />}
          {viewMode === "heatmap" && <HeatmapView graph={graph} filter={filter} settings={viewSettings.heatmap} fills={fills} />}
          {viewMode === "pie" && <PieChartView graph={graph} filter={filter} fills={fills} />}
        </div>
      </main>
    </div>
  )
}

export default function GraphPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
            <p className="text-muted text-sm tracking-wide">Loading...</p>
          </div>
        </div>
      }
    >
      <GraphPageInner />
    </Suspense>
  )
}
