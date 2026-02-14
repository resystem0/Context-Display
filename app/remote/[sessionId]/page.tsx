"use client"

import { Suspense, use, useState, useCallback, useEffect } from "react"

type SessionState = {
  selectedNodeId?: string
  zoomState: "overview" | "cluster" | "detail"
  autoPlay: boolean
  path: string[]
  updatedAt: number
}

const ZOOM_LEVELS = ["overview", "cluster", "detail"] as const

function RemotePageInner({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const [status, setStatus] = useState("")
  const [neighborIndex, setNeighborIndex] = useState(0)
  const [lastPathId, setLastPathId] = useState<string | null>(null)
  const [isAutoPlay, setIsAutoPlay] = useState(true)

  const api = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/session/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      return (await res.json()) as SessionState
    },
    [sessionId],
  )

  const getState = useCallback(async () => {
    const res = await fetch(`/api/session/${sessionId}`)
    if (!res.ok) return null
    return (await res.json()) as SessionState
  }, [sessionId])

  // Sync auto-play state from server
  useEffect(() => {
    const syncState = async () => {
      const state = await getState()
      if (state) {
        setIsAutoPlay(state.autoPlay)
      }
    }
    syncState()
    const interval = setInterval(syncState, 2000)
    return () => clearInterval(interval)
  }, [getState])

  const toggleAutoPlay = async () => {
    const newValue = !isAutoPlay
    await api({ autoPlay: newValue })
    setIsAutoPlay(newValue)
    setStatus(`Auto-Play: ${newValue ? "ON" : "OFF"}`)
  }

  const zoomIn = async () => {
    const state = await getState()
    if (!state) return
    const idx = ZOOM_LEVELS.indexOf(state.zoomState)
    if (idx < ZOOM_LEVELS.length - 1) {
      await api({ zoomState: ZOOM_LEVELS[idx + 1] })
      setStatus(`Zoom: ${ZOOM_LEVELS[idx + 1]}`)
    }
  }

  const zoomOut = async () => {
    const state = await getState()
    if (!state) return
    const idx = ZOOM_LEVELS.indexOf(state.zoomState)
    if (idx > 0) {
      await api({ zoomState: ZOOM_LEVELS[idx - 1] })
      setStatus(`Zoom: ${ZOOM_LEVELS[idx - 1]}`)
    }
  }

  const clearSelection = async () => {
    await api({ selectedNodeId: "" })
    setNeighborIndex(0)
    setStatus("Selection cleared")
  }

  const nextNeighbor = async () => {
    const state = await getState()
    if (!state?.selectedNodeId) {
      setStatus("No node selected")
      return
    }
    // Fetch the graph to get neighbor info
    const graphRes = await fetch("/api/bonfire/activities")
    if (!graphRes.ok) {
      setStatus("Could not load graph")
      return
    }
    const graph = await graphRes.json()
    const edges = graph.edges ?? []
    const nodeId = state.selectedNodeId
    const neighborIds = new Set<string>()
    for (const e of edges) {
      if (e.source === nodeId) neighborIds.add(e.target)
      if (e.target === nodeId) neighborIds.add(e.source)
    }
    const neighbors = Array.from(neighborIds)
    if (neighbors.length === 0) {
      setStatus("No neighbors")
      return
    }
    const idx = neighborIndex % neighbors.length
    const next = neighbors[idx]
    await api({ selectedNodeId: next })
    setNeighborIndex(idx + 1)
    setStatus(`Selected: ${next}`)
  }

  const prevNode = async () => {
    const state = await getState()
    if (!state || state.path.length < 2) {
      setStatus("No previous node")
      return
    }
    const prev = state.path[state.path.length - 2]
    await api({ selectedNodeId: prev })
    setStatus(`Back to: ${prev}`)
  }

  const savePath = async () => {
    const state = await getState()
    if (!state || state.path.length === 0) {
      setStatus("No path to save")
      return
    }
    const res = await fetch("/api/paths", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, path: state.path }),
    })
    const data = await res.json()
    setLastPathId(data.pathId)
    setStatus("Path saved!")
  }

  const exportPath = () => {
    if (!lastPathId) {
      setStatus("Save a path first")
      return
    }
    window.open(`/api/paths/${lastPathId}/export`, "_blank")
    setStatus("Exporting...")
  }

  const buttons = [
    {
      label: isAutoPlay ? "Auto-Play: ON" : "Auto-Play: OFF",
      action: toggleAutoPlay,
      highlight: isAutoPlay,
    },
    { label: "Zoom In", action: zoomIn },
    { label: "Zoom Out", action: zoomOut },
    { label: "Clear Selection", action: clearSelection },
    { label: "Next Neighbor", action: nextNeighbor },
    { label: "Previous Node", action: prevNode },
    { label: "Save Path", action: savePath },
    { label: "Export Path", action: exportPath },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6">
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
        Remote Controller
      </h1>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {buttons.map((b) => (
          <button
            key={b.label}
            onClick={b.action}
            className={`border rounded-lg p-4 text-sm font-medium transition-colors shadow-sm ${
              "highlight" in b && b.highlight
                ? "bg-emerald-500 border-emerald-600 text-white active:bg-emerald-600"
                : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 active:bg-neutral-100 dark:active:bg-neutral-700"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {status && (
        <p className="mt-4 text-xs text-neutral-500">{status}</p>
      )}

      <p className="mt-8 text-xs text-neutral-400">
        Session: {sessionId.slice(0, 8)}&hellip;
      </p>
    </div>
  )
}

export default function RemotePage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
          <p className="text-neutral-400 text-sm">Loading...</p>
        </div>
      }
    >
      <RemotePageInner params={params} />
    </Suspense>
  )
}
