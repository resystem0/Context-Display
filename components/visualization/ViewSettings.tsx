"use client"

import { useState } from "react"
import { VIEW_SETTING_DEFS, type SettingDef } from "@/lib/graph/viewSettings"

type ViewSettingsProps = {
  viewMode: string
  values: Record<string, unknown>
  onChange: (key: string, value: number | boolean) => void
}

export default function ViewSettings({
  viewMode,
  values,
  onChange,
}: ViewSettingsProps) {
  const defs = VIEW_SETTING_DEFS[viewMode]
  const entries = defs ? Object.entries(defs) : []
  const [open, setOpen] = useState(false)

  if (entries.length === 0) return null

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-muted bg-surface hover:bg-surface-hover transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Settings
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="px-4 py-3 space-y-4 bg-surface/50 border-t border-border">
          {entries.map(([key, def]) => (
            <SettingRow
              key={key}
              settingKey={key}
              def={def}
              value={values[key]}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SettingRow({
  settingKey,
  def,
  value,
  onChange,
}: {
  settingKey: string
  def: SettingDef
  value: unknown
  onChange: (key: string, value: number | boolean) => void
}) {
  if (def.type === "toggle") {
    const checked = (value as boolean) ?? def.default
    return (
      <label className="flex items-center justify-between cursor-pointer group">
        <span className="text-xs text-foreground/60 group-hover:text-foreground/80 transition-colors">
          {def.label}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(settingKey, !checked)}
          className={`toggle-track relative inline-flex h-5 w-9 items-center rounded-full ${
            checked
              ? "bg-accent-purple"
              : "bg-border-bright"
          }`}
        >
          <span
            className={`toggle-thumb inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm ${
              checked ? "translate-x-4.5" : "translate-x-0.5"
            }`}
          />
        </button>
      </label>
    )
  }

  // Slider
  const numValue = (value as number) ?? def.default
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-foreground/60">
          {def.label}
        </span>
        <span className="text-xs font-mono text-accent-purple tabular-nums">
          {def.step < 1 ? numValue.toFixed(2) : numValue}
        </span>
      </div>
      <input
        type="range"
        min={def.min}
        max={def.max}
        step={def.step}
        value={numValue}
        onChange={(e) => onChange(settingKey, parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  )
}
