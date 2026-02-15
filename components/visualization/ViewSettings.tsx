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
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <span>⚙ Settings</span>
        <span className="text-neutral-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-3 py-3 space-y-3 bg-white dark:bg-neutral-900">
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
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-xs text-neutral-700 dark:text-neutral-300">
          {def.label}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(settingKey, !checked)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            checked
              ? "bg-blue-500"
              : "bg-neutral-300 dark:bg-neutral-600"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
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
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-neutral-700 dark:text-neutral-300">
          {def.label}
        </span>
        <span className="text-xs font-mono text-neutral-500 tabular-nums">
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
        className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  )
}
