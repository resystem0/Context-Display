import { create } from "zustand"
import { AllViewSettings, DEFAULT_VIEW_SETTINGS } from "./viewSettings"
import type { ColorTheme, CloudFont } from "./colors"

export type ZoomState = "overview" | "cluster" | "detail"

export type PagePrefs = {
  background: string | null
  cloudFont: CloudFont
  colorTheme: ColorTheme
}

export const DEFAULT_PAGE_PREFS: PagePrefs = {
  background: null,
  cloudFont: "sans",
  colorTheme: "default",
}

type InteractionState = {
  selectedNodeId?: string
  highlightedNodeIds: string[]
  zoomState: ZoomState
  autoPlay: boolean
  viewMode: string
  viewSettings: AllViewSettings
  pagePrefs: PagePrefs
  selectNode: (id?: string) => void
  setHighlights: (ids: string[]) => void
  setZoomState: (z: ZoomState) => void
  setAutoPlay: (v: boolean) => void
  setViewMode: (m: string) => void
  setViewSettings: (viewMode: string, patch: Record<string, unknown>) => void
  setPagePrefs: (patch: Partial<PagePrefs>) => void
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
  pagePrefs: DEFAULT_PAGE_PREFS,

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

  setPagePrefs: (patch) =>
    set((state) => ({
      pagePrefs: { ...state.pagePrefs, ...patch },
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
      pagePrefs: DEFAULT_PAGE_PREFS,
    }),
}))

function deepMergeSettings(
  base: AllViewSettings,
  incoming: AllViewSettings,
): AllViewSettings {
  const result = { ...base } as Record<string, Record<string, unknown>>
  for (const key of Object.keys(incoming)) {
    result[key] = {
      ...(base[key as keyof AllViewSettings] as Record<string, unknown>),
      ...(incoming[key as keyof AllViewSettings] as Record<string, unknown>),
    }
  }
  return result as unknown as AllViewSettings
}
