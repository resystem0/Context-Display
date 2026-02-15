import { create } from "zustand"
import { AllViewSettings, DEFAULT_VIEW_SETTINGS } from "./viewSettings"

export type ZoomState = "overview" | "cluster" | "detail"

type InteractionState = {
  selectedNodeId?: string
  highlightedNodeIds: string[]
  zoomState: ZoomState
  autoPlay: boolean
  viewMode: string
  viewSettings: AllViewSettings
  selectNode: (id?: string) => void
  setHighlights: (ids: string[]) => void
  setZoomState: (z: ZoomState) => void
  setAutoPlay: (v: boolean) => void
  setViewMode: (m: string) => void
  setViewSettings: (viewMode: string, patch: Record<string, unknown>) => void
  applyServerState: (state: {
    selectedNodeId?: string
    zoomState: ZoomState
    autoPlay?: boolean
    highlightedNodeIds?: string[]
    viewMode?: string
    viewSettings?: AllViewSettings
  }) => void
  clear: () => void
}

export const useGraphInteraction = create<InteractionState>((set) => ({
  selectedNodeId: undefined,
  highlightedNodeIds: [],
  zoomState: "overview" as ZoomState,
  autoPlay: true,
  viewMode: "force",
  viewSettings: DEFAULT_VIEW_SETTINGS,

  selectNode: (id) => set({ selectedNodeId: id }),
  setHighlights: (ids) => set({ highlightedNodeIds: ids }),
  setZoomState: (z) => set({ zoomState: z }),
  setAutoPlay: (v) => set({ autoPlay: v }),
  setViewMode: (m) => set({ viewMode: m }),

  setViewSettings: (viewMode, patch) =>
    set((state) => ({
      viewSettings: {
        ...state.viewSettings,
        [viewMode]: {
          ...(state.viewSettings[viewMode as keyof AllViewSettings] ?? {}),
          ...patch,
        },
      },
    })),

  applyServerState: (state) =>
    set((prev) => ({
      selectedNodeId: state.selectedNodeId,
      zoomState: state.zoomState,
      ...(state.autoPlay !== undefined && { autoPlay: state.autoPlay }),
      ...(state.highlightedNodeIds !== undefined && {
        highlightedNodeIds: state.highlightedNodeIds,
      }),
      ...(state.viewMode !== undefined && { viewMode: state.viewMode }),
      ...(state.viewSettings !== undefined && {
        viewSettings: deepMergeSettings(prev.viewSettings, state.viewSettings),
      }),
    })),

  clear: () =>
    set({
      selectedNodeId: undefined,
      highlightedNodeIds: [],
      zoomState: "overview",
      autoPlay: true,
      viewMode: "force",
      viewSettings: DEFAULT_VIEW_SETTINGS,
    }),
}))

function deepMergeSettings(
  base: AllViewSettings,
  incoming: AllViewSettings,
): AllViewSettings {
  const result = { ...base }
  for (const key of Object.keys(incoming) as (keyof AllViewSettings)[]) {
    result[key] = { ...base[key], ...incoming[key] } as AllViewSettings[typeof key]
  }
  return result
}
