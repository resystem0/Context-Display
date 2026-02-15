"use client"

import { Suspense, use, useState, useCallback, useEffect, useRef } from "react"

/* ── Types ── */

type GraphNode = {
  id: string
  label: string
  group: string
  weight?: number
}

type GraphEdge = {
  source: string
  target: string
}

type GraphData = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

type SessionState = {
  selectedNodeId?: string
  highlightedNodeIds: string[]
  viewMode: string
  zoomState: string
  autoPlay: boolean
  path: string[]
  updatedAt: number
}

/* ── View mode options ── */

const VIEW_MODES = [
  { value: "list", label: "List" },
  { value: "cloud", label: "Ring Cloud" },
  { value: "d3cloud", label: "Word Cloud" },
  { value: "animated", label: "Animated Cloud" },
  { value: "force", label: "Force Graph" },
  { value: "bubble", label: "Bubble Pack" },
  { value: "heatmap", label: "Heatmap" },
  { value: "tree", label: "Tree" },
  { value: "pie", label: "Pie Chart" },
] as const

/* ── Helpers ── */

function getNeighborIds(graph: GraphData, nodeId: string): string[] {
  const ids = new Set<string>()
  for (const e of graph.edges) {
    if (e.source === nodeId) ids.add(e.target)
    if (e.target === nodeId) ids.add(e.source)
  }
  return Array.from(ids)
}

function getNodeLabel(graph: GraphData, nodeId: string): string {
  const node = graph.nodes.find((n) => n.id === nodeId)
  return node?.label ?? nodeId.slice(0, 8)
}

/* ── Main component ── */

function RemotePageInner({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)

  // State
  const [status, setStatus] = useState("")
  const [graph, setGraph] = useState<GraphData | null>(null)
  const [session, setSession] = useState<SessionState | null>(null)
  const neighborIndexRef = useRef(0)
  const [lastPathId, setLastPathId] = useState<string | null>(null)

  // ── API helpers ──
  const api = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/session/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const state = (await res.json()) as SessionState
      setSession(state)
      return state
    },
    [sessionId],
  )

  const getState = useCallback(async () => {
    const res = await fetch(`/api/session/${sessionId}`)
    if (!res.ok) return null
    const state = (await res.json()) as SessionState
    setSession(state)
    return state
  }, [sessionId])

  // ── Load graph data once ──
  useEffect(() => {
    fetch("/api/bonfire/activities")
      .then((r) => r.json())
      .then((g) => setGraph(g))
      .catch(() => setStatus("Could not load graph"))
  }, [])

  // ── Poll session state ──
  useEffect(() => {
    const poll = async () => {
      await getState()
    }
    poll()
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [getState])

  // ── Derived values ──
  const selectedNodeId = session?.selectedNodeId
  const selectedLabel = selectedNodeId && graph
    ? getNodeLabel(graph, selectedNodeId)
    : null
  const neighborCount = selectedNodeId && graph
    ? getNeighborIds(graph, selectedNodeId).length
    : 0

  // ── Actions ──

  const selectNodeWithHighlights = async (nodeId: string) => {
    if (!graph) return
    const neighbors = getNeighborIds(graph, nodeId)
    await api({
      selectedNodeId: nodeId,
      highlightedNodeIds: neighbors,
    })
    const label = getNodeLabel(graph, nodeId)
    setStatus(`Selected: ${label}`)
  }

  const toggleAutoPlay = async () => {
    const newValue = !(session?.autoPlay ?? true)
    await api({ autoPlay: newValue })
    setStatus(`Auto-Play: ${newValue ? "ON" : "OFF"}`)
  }

  const changeView = async (mode: string) => {
    await api({ viewMode: mode })
    const label = VIEW_MODES.find((v) => v.value === mode)?.label ?? mode
    setStatus(`View: ${label}`)
  }

  const clearSelection = async () => {
    await api({ selectedNodeId: "", highlightedNodeIds: [] })
    neighborIndexRef.current = 0
    setStatus("Selection cleared")
  }

  const randomNode = async () => {
    if (!graph || graph.nodes.length === 0) {
      setStatus("No nodes available")
      return
    }
    const idx = Math.floor(Math.random() * graph.nodes.length)
    const node = graph.nodes[idx]
    await selectNodeWithHighlights(node.id)
    neighborIndexRef.current = 0
  }

  const nextNeighbor = async () => {
    if (!graph || !selectedNodeId) {
      setStatus("Select a node first")
      return
    }
    const neighbors = getNeighborIds(graph, selectedNodeId)
    if (neighbors.length === 0) {
      setStatus("No neighbors")
      return
    }
    const idx = neighborIndexRef.current % neighbors.length
    const nextId = neighbors[idx]
    neighborIndexRef.current = idx + 1
    await selectNodeWithHighlights(nextId)
  }

  const prevNode = async () => {
    if (!session || !graph || session.path.length < 2) {
      setStatus("No previous node")
      return
    }
    const prevId = session.path[session.path.length - 2]
    neighborIndexRef.current = 0
    await selectNodeWithHighlights(prevId)
  }

  const savePath = async () => {
    const state = session ?? (await getState())
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
    setStatus(`Path saved (${state.path.length} nodes)`)
  }

  const exportPath = () => {
    if (!lastPathId) {
      setStatus("Save a path first")
      return
    }
    window.open(`/api/paths/${lastPathId}/export`, "_blank")
    setStatus("Exporting...")
  }

  const currentViewLabel =
    VIEW_MODES.find((v) => v.value === session?.viewMode)?.label ?? "—"

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center p-4 pt-6">
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
        Remote Controller
      </h1>
      <p className="text-xs text-neutral-400 mb-4">
        Session: {sessionId.slice(0, 8)}&hellip;
      </p>

      {/* ── Status bar ── */}
      <div className="w-full max-w-sm mb-4 rounded-lg bg-neutral-100 dark:bg-neutral-900 p-3 text-center">
        <p className="text-xs text-neutral-500 mb-1">
          View: <span className="font-medium text-neutral-700 dark:text-neutral-300">{currentViewLabel}</span>
        </p>
        {selectedLabel ? (
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
            🔵 {selectedLabel}
            <span className="text-xs font-normal text-neutral-500 ml-1">
              ({neighborCount} neighbors)
            </span>
          </p>
        ) : (
          <p className="text-sm text-neutral-400">No node selected</p>
        )}
      </div>

      {/* ── View Mode Selector ── */}
      <div className="w-full max-w-sm mb-4">
        <select
          value={session?.viewMode ?? "force"}
          onChange={(e) => changeView(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {VIEW_MODES.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Control Buttons ── */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {/* Auto-Play */}
        <button
          onClick={toggleAutoPlay}
          className={`rounded-lg p-4 text-sm font-medium transition-colors shadow-sm ${
            session?.autoPlay
              ? "bg-emerald-500 border border-emerald-600 text-white active:bg-emerald-600"
              : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 active:bg-neutral-100 dark:active:bg-neutral-700"
          }`}
        >
          {session?.autoPlay ? "⏸ Auto-Play ON" : "▶ Auto-Play OFF"}
        </button>

        {/* Random Node */}
        <button
          onClick={randomNode}
          className="rounded-lg p-4 text-sm font-medium bg-blue-500 border border-blue-600 text-white active:bg-blue-600 transition-colors shadow-sm"
        >
          🎲 Random Node
        </button>

        {/* Next Neighbor */}
        <button
          onClick={nextNeighbor}
          disabled={!selectedNodeId}
          className={`rounded-lg p-4 text-sm font-medium transition-colors shadow-sm border ${
            selectedNodeId
              ? "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 active:bg-neutral-100 dark:active:bg-neutral-700"
              : "bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400 cursor-not-allowed"
          }`}
        >
          → Next Neighbor
        </button>

        {/* Previous Node */}
        <button
          onClick={prevNode}
          disabled={!session || session.path.length < 2}
          className={`rounded-lg p-4 text-sm font-medium transition-colors shadow-sm border ${
            session && session.path.length >= 2
              ? "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 active:bg-neutral-100 dark:active:bg-neutral-700"
              : "bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400 cursor-not-allowed"
          }`}
        >
          ← Go Back
        </button>

        {/* Clear Selection */}
        <button
          onClick={clearSelection}
          disabled={!selectedNodeId}
          className={`rounded-lg p-4 text-sm font-medium transition-colors shadow-sm border ${
            selectedNodeId
              ? "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 active:bg-neutral-100 dark:active:bg-neutral-700"
              : "bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400 cursor-not-allowed"
          }`}
        >
          ✕ Clear
        </button>

        {/* Save Path */}
        <button
          onClick={savePath}
          disabled={!session || session.path.length === 0}
          className={`rounded-lg p-4 text-sm font-medium transition-colors shadow-sm border ${
            session && session.path.length > 0
              ? "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 active:bg-neutral-100 dark:active:bg-neutral-700"
              : "bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400 cursor-not-allowed"
          }`}
        >
          💾 Save Path
        </button>

        {/* Export Path - spans full width */}
        <button
          onClick={exportPath}
          disabled={!lastPathId}
          className={`col-span-2 rounded-lg p-4 text-sm font-medium transition-colors shadow-sm border ${
            lastPathId
              ? "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 active:bg-neutral-100 dark:active:bg-neutral-700"
              : "bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400 cursor-not-allowed"
          }`}
        >
          📤 Export Path
        </button>
      </div>

      {/* ── Status message ── */}
      {status && (
        <p className="mt-4 text-xs text-neutral-500 animate-pulse">{status}</p>
      )}

      {/* ── Path breadcrumb ── */}
      {session && session.path.length > 0 && graph && (
        <div className="mt-4 w-full max-w-sm">
          <p className="text-xs text-neutral-400 mb-1">
            Path ({session.path.length} nodes):
          </p>
          <div className="flex flex-wrap gap-1">
            {session.path.slice(-8).map((nodeId, i) => (
              <button
                key={`${nodeId}-${i}`}
                onClick={() => selectNodeWithHighlights(nodeId)}
                className="text-xs px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors truncate max-w-[120px]"
              >
                {getNodeLabel(graph, nodeId)}
              </button>
            ))}
            {session.path.length > 8 && (
              <span className="text-xs text-neutral-400 px-1">
                +{session.path.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}
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
