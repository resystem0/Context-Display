import { create } from "zustand"

export type ZoomState = "overview" | "cluster" | "detail"

type InteractionState = {
  selectedNodeId?: string
  highlightedNodeIds: string[]
  zoomState: ZoomState
  autoPlay: boolean
  selectNode: (id?: string) => void
  setHighlights: (ids: string[]) => void
  setZoomState: (z: ZoomState) => void
  setAutoPlay: (v: boolean) => void
  applyServerState: (state: {
    selectedNodeId?: string
    zoomState: ZoomState
    autoPlay?: boolean
    highlightedNodeIds?: string[]
  }) => void
  clear: () => void
}

export const useGraphInteraction = create<InteractionState>((set) => ({
  selectedNodeId: undefined,
  highlightedNodeIds: [],
  zoomState: "overview" as ZoomState,
  autoPlay: true,

  selectNode: (id) => set({ selectedNodeId: id }),
  setHighlights: (ids) => set({ highlightedNodeIds: ids }),
  setZoomState: (z) => set({ zoomState: z }),
  setAutoPlay: (v) => set({ autoPlay: v }),

  applyServerState: (state) =>
    set({
      selectedNodeId: state.selectedNodeId,
      zoomState: state.zoomState,
      ...(state.autoPlay !== undefined && { autoPlay: state.autoPlay }),
      ...(state.highlightedNodeIds !== undefined && {
        highlightedNodeIds: state.highlightedNodeIds,
      }),
    }),

  clear: () =>
    set({
      selectedNodeId: undefined,
      highlightedNodeIds: [],
      zoomState: "overview",
      autoPlay: true,
    }),
}))
