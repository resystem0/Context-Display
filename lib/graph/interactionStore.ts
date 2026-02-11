import { create } from "zustand"

export type ZoomState = "overview" | "cluster" | "detail"

type InteractionState = {
  selectedNodeId?: string
  highlightedNodeIds: string[]
  zoomState: ZoomState
  selectNode: (id?: string) => void
  setHighlights: (ids: string[]) => void
  setZoomState: (z: ZoomState) => void
  applyServerState: (state: {
    selectedNodeId?: string
    zoomState: ZoomState
    highlightedNodeIds?: string[]
  }) => void
  clear: () => void
}

export const useGraphInteraction = create<InteractionState>((set) => ({
  selectedNodeId: undefined,
  highlightedNodeIds: [],
  zoomState: "overview" as ZoomState,

  selectNode: (id) => set({ selectedNodeId: id }),
  setHighlights: (ids) => set({ highlightedNodeIds: ids }),
  setZoomState: (z) => set({ zoomState: z }),

  applyServerState: (state) =>
    set({
      selectedNodeId: state.selectedNodeId,
      zoomState: state.zoomState,
      ...(state.highlightedNodeIds !== undefined && {
        highlightedNodeIds: state.highlightedNodeIds,
      }),
    }),

  clear: () =>
    set({
      selectedNodeId: undefined,
      highlightedNodeIds: [],
      zoomState: "overview",
    }),
}))
