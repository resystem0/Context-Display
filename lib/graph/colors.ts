/* ── Color themes ── */

export type ColorTheme = "default" | "fire" | "ice"

export type CloudFont = "sans" | "serif" | "mono" | "cursive" | "display"

/* Default Cosmos-inspired vibrant palette */
export const GROUP_FILL: Record<string, string> = {
  actor: "#6366f1",   // indigo-purple (From)
  activity: "#f59e0b", // amber-gold (About)
  tag: "#22d3a7",      // teal-green
  unknown: "#6b6b80",  // muted gray
}

/* Fire theme — warm oranges, reds, yellows */
export const GROUP_FILL_FIRE: Record<string, string> = {
  actor: "#ef4444",    // red
  activity: "#f97316", // orange
  tag: "#eab308",      // yellow
  unknown: "#a16207",  // dark amber
}

/* Ice theme — cool blues, cyans, whites */
export const GROUP_FILL_ICE: Record<string, string> = {
  actor: "#38bdf8",    // sky blue
  activity: "#818cf8", // indigo light
  tag: "#67e8f9",      // cyan
  unknown: "#94a3b8",  // slate
}

/* Gradient pairs per theme [from, to] */
export const GRADIENT_COLORS: Record<string, Record<string, [string, string]>> = {
  default: {
    actor: ["#6366f1", "#818cf8"],
    activity: ["#f59e0b", "#fbbf24"],
    tag: ["#22d3a7", "#34d399"],
    unknown: ["#6b6b80", "#a1a1aa"],
  },
  fire: {
    actor: ["#ef4444", "#f87171"],
    activity: ["#f97316", "#fb923c"],
    tag: ["#eab308", "#facc15"],
    unknown: ["#a16207", "#ca8a04"],
  },
  ice: {
    actor: ["#38bdf8", "#7dd3fc"],
    activity: ["#818cf8", "#a5b4fc"],
    tag: ["#67e8f9", "#a5f3fc"],
    unknown: ["#94a3b8", "#cbd5e1"],
  },
}

/** Get the fill map for a given theme */
export function getThemeFills(theme: ColorTheme): Record<string, string> {
  if (theme === "fire") return GROUP_FILL_FIRE
  if (theme === "ice") return GROUP_FILL_ICE
  return GROUP_FILL
}

/** Get gradient pairs for a given theme */
export function getThemeGradients(theme: ColorTheme): Record<string, [string, string]> {
  return GRADIENT_COLORS[theme] ?? GRADIENT_COLORS.default
}

/* Cloud font families */
export const CLOUD_FONTS: Record<CloudFont, string> = {
  sans: '"Inter", "SF Pro Display", -apple-system, sans-serif',
  serif: '"Georgia", "Times New Roman", serif',
  mono: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
  cursive: '"Segoe Script", "Apple Chancery", "Comic Sans MS", cursive',
  display: '"Impact", "Arial Black", "Trebuchet MS", sans-serif',
}

export const CLOUD_FONT_OPTIONS: { value: CloudFont; label: string }[] = [
  { value: "sans", label: "Sans Serif" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Monospace" },
  { value: "cursive", label: "Handwriting" },
  { value: "display", label: "Display" },
]

export const GROUP_ORDER: Record<string, number> = {
  actor: 0,
  activity: 1,
  tag: 2,
  unknown: 3,
}

/* Display labels for UI */
export const GROUP_LABELS: Record<string, string> = {
  actor: "from",
  activity: "about",
  tag: "tag",
  unknown: "unknown",
}
