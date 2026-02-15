"use client"

import { useEffect, useRef } from "react"
import { useGraphInteraction } from "@/lib/graph/interactionStore"

export function useSessionPolling(sessionId: string | null) {
  const lastUpdatedAt = useRef(0)
  const applyServerState = useGraphInteraction((s) => s.applyServerState)

  useEffect(() => {
    if (!sessionId) return

    let active = true

    const poll = async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}`)
        if (!res.ok || !active) return
        const data = await res.json()
        if (data && data.updatedAt !== lastUpdatedAt.current) {
          lastUpdatedAt.current = data.updatedAt
          applyServerState({
            selectedNodeId: data.selectedNodeId,
            highlightedNodeIds: data.highlightedNodeIds,
            zoomState: data.zoomState,
            autoPlay: data.autoPlay,
            viewMode: data.viewMode,
            viewSettings: data.viewSettings,
          })
        }
      } catch {
        // Silently ignore polling errors
      }
    }

    const id = setInterval(poll, 500)
    poll() // initial fetch

    return () => {
      active = false
      clearInterval(id)
    }
  }, [sessionId, applyServerState])
}
