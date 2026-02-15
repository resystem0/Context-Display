/* ── Per-view configurable settings ── */

// ── Setting definition types (drive UI rendering) ──

export type SliderDef = {
  type: "slider"
  label: string
  min: number
  max: number
  step: number
  default: number
}

export type ToggleDef = {
  type: "toggle"
  label: string
  default: boolean
}

export type SettingDef = SliderDef | ToggleDef

// ── Concrete settings per view ──

export type ForceSettings = {
  linkDistance: number
  chargeStrength: number
  minRadius: number
  maxRadius: number
  showLabels: boolean
}

export type CloudSettings = {
  minFont: number
  maxFont: number
  cycleInterval: number
  rotationSpeed: number
}

export type D3CloudSettings = {
  minFont: number
  maxFont: number
  wordPadding: number
}

export type AnimatedSettings = {
  minFont: number
  maxFont: number
  cycleInterval: number
  wordPadding: number
}

export type BubbleSettings = {
  packPadding: number
  showGroupLabels: boolean
}

export type HeatmapSettings = {
  maxNodes: number
  labelMargin: number
}

export type TreeSettings = {
  minRadius: number
  maxRadius: number
  showLabels: boolean
}

// ── Union map ──

export type ViewSettingsMap = {
  force: ForceSettings
  cloud: CloudSettings
  d3cloud: D3CloudSettings
  animated: AnimatedSettings
  bubble: BubbleSettings
  heatmap: HeatmapSettings
  tree: TreeSettings
  list: Record<string, never>
  pie: Record<string, never>
}

export type AllViewSettings = {
  [K in keyof ViewSettingsMap]: ViewSettingsMap[K]
}

// ── Defaults ──

export const DEFAULT_FORCE: ForceSettings = {
  linkDistance: 80,
  chargeStrength: -120,
  minRadius: 5,
  maxRadius: 20,
  showLabels: true,
}

export const DEFAULT_CLOUD: CloudSettings = {
  minFont: 14,
  maxFont: 52,
  cycleInterval: 5000,
  rotationSpeed: 0.1,
}

export const DEFAULT_D3CLOUD: D3CloudSettings = {
  minFont: 12,
  maxFont: 60,
  wordPadding: 4,
}

export const DEFAULT_ANIMATED: AnimatedSettings = {
  minFont: 12,
  maxFont: 60,
  cycleInterval: 5000,
  wordPadding: 4,
}

export const DEFAULT_BUBBLE: BubbleSettings = {
  packPadding: 3,
  showGroupLabels: true,
}

export const DEFAULT_HEATMAP: HeatmapSettings = {
  maxNodes: 40,
  labelMargin: 80,
}

export const DEFAULT_TREE: TreeSettings = {
  minRadius: 4,
  maxRadius: 16,
  showLabels: true,
}

export const DEFAULT_VIEW_SETTINGS: AllViewSettings = {
  force: DEFAULT_FORCE,
  cloud: DEFAULT_CLOUD,
  d3cloud: DEFAULT_D3CLOUD,
  animated: DEFAULT_ANIMATED,
  bubble: DEFAULT_BUBBLE,
  heatmap: DEFAULT_HEATMAP,
  tree: DEFAULT_TREE,
  list: {},
  pie: {},
}

// ── Setting definitions (drive the UI) ──

export const VIEW_SETTING_DEFS: Record<string, Record<string, SettingDef>> = {
  force: {
    linkDistance: { type: "slider", label: "Link Distance", min: 20, max: 200, step: 10, default: 80 },
    chargeStrength: { type: "slider", label: "Charge Strength", min: -300, max: -20, step: 10, default: -120 },
    minRadius: { type: "slider", label: "Min Node Size", min: 2, max: 12, step: 1, default: 5 },
    maxRadius: { type: "slider", label: "Max Node Size", min: 12, max: 40, step: 1, default: 20 },
    showLabels: { type: "toggle", label: "Show Labels", default: true },
  },
  cloud: {
    minFont: { type: "slider", label: "Min Font Size", min: 8, max: 30, step: 1, default: 14 },
    maxFont: { type: "slider", label: "Max Font Size", min: 30, max: 80, step: 2, default: 52 },
    cycleInterval: { type: "slider", label: "Cycle Speed (ms)", min: 1000, max: 15000, step: 500, default: 5000 },
    rotationSpeed: { type: "slider", label: "Rotation Speed", min: 0, max: 0.5, step: 0.02, default: 0.1 },
  },
  d3cloud: {
    minFont: { type: "slider", label: "Min Font Size", min: 8, max: 30, step: 1, default: 12 },
    maxFont: { type: "slider", label: "Max Font Size", min: 30, max: 100, step: 2, default: 60 },
    wordPadding: { type: "slider", label: "Word Padding", min: 0, max: 20, step: 1, default: 4 },
  },
  animated: {
    minFont: { type: "slider", label: "Min Font Size", min: 8, max: 30, step: 1, default: 12 },
    maxFont: { type: "slider", label: "Max Font Size", min: 30, max: 100, step: 2, default: 60 },
    cycleInterval: { type: "slider", label: "Cycle Speed (ms)", min: 1000, max: 15000, step: 500, default: 5000 },
    wordPadding: { type: "slider", label: "Word Padding", min: 0, max: 20, step: 1, default: 4 },
  },
  bubble: {
    packPadding: { type: "slider", label: "Pack Padding", min: 0, max: 20, step: 1, default: 3 },
    showGroupLabels: { type: "toggle", label: "Show Group Labels", default: true },
  },
  heatmap: {
    maxNodes: { type: "slider", label: "Max Nodes", min: 10, max: 100, step: 5, default: 40 },
    labelMargin: { type: "slider", label: "Label Margin", min: 40, max: 150, step: 5, default: 80 },
  },
  tree: {
    minRadius: { type: "slider", label: "Min Node Size", min: 2, max: 10, step: 1, default: 4 },
    maxRadius: { type: "slider", label: "Max Node Size", min: 10, max: 30, step: 1, default: 16 },
    showLabels: { type: "toggle", label: "Show Labels", default: true },
  },
  list: {},
  pie: {},
}
