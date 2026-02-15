"use client"

import { useState, useRef, useEffect } from "react"

export type BgOption = {
  id: string
  label: string
  thumb: string
  value: string | null // null = no background (default dark)
}

const BACKGROUNDS: BgOption[] = [
  { id: "none", label: "None", thumb: "", value: null },
  { id: "nebula", label: "Nebula", thumb: "/backgrounds/nebula.jpg", value: "/backgrounds/nebula.jpg" },
  { id: "mountains", label: "Mountains", thumb: "/backgrounds/mountains.jpg", value: "/backgrounds/mountains.jpg" },
  { id: "fire", label: "Bonfire", thumb: "/backgrounds/fire.jpg", value: "/backgrounds/fire.jpg" },
  { id: "brain", label: "Neural", thumb: "/backgrounds/brain.jpg", value: "/backgrounds/brain.jpg" },
]

type BackgroundPickerProps = {
  value: string | null
  onChange: (bg: string | null) => void
}

export function BackgroundPicker({ value, onChange }: BackgroundPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    }
  }, [open])

  const current = BACKGROUNDS.find((b) => b.value === value) ?? BACKGROUNDS[0]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-surface text-muted hover:text-foreground/80 hover:border-border-bright transition-all duration-200 flex items-center gap-2"
      >
        {current.thumb ? (
          <span
            className="w-4 h-4 rounded-sm bg-cover bg-center border border-border-bright"
            style={{ backgroundImage: `url(${current.thumb})` }}
          />
        ) : (
          <span className="w-4 h-4 rounded-sm bg-background border border-border-bright" />
        )}
        Background
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 glass rounded-xl border border-border p-2 shadow-2xl glow-border w-[200px]">
          <div className="space-y-1">
            {BACKGROUNDS.map((bg) => {
              const isActive = bg.value === value
              return (
                <button
                  key={bg.id}
                  onClick={() => {
                    onChange(bg.value)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-accent-purple/15 text-accent-purple border border-accent-purple/30"
                      : "text-foreground/70 hover:bg-surface-hover border border-transparent"
                  }`}
                >
                  {bg.thumb ? (
                    <span
                      className="w-8 h-8 rounded-md bg-cover bg-center border border-border-bright shrink-0"
                      style={{ backgroundImage: `url(${bg.thumb})` }}
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-md bg-background border border-border-bright shrink-0 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </span>
                  )}
                  <span>{bg.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
