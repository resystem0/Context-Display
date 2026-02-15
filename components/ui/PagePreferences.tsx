"use client"

import { useState, useRef, useEffect } from "react"
import { useGraphInteraction } from "@/lib/graph/interactionStore"
import type { ColorTheme, CloudFont } from "@/lib/graph/colors"
import { CLOUD_FONT_OPTIONS } from "@/lib/graph/colors"

/* ── Background options ── */

const BACKGROUNDS = [
  { id: "none", label: "None", thumb: "", value: null },
  { id: "nebula", label: "Nebula", thumb: "/backgrounds/nebula.jpg", value: "/backgrounds/nebula.jpg" },
  { id: "mountains", label: "Mountains", thumb: "/backgrounds/mountains.jpg", value: "/backgrounds/mountains.jpg" },
  { id: "fire", label: "Bonfire", thumb: "/backgrounds/fire.jpg", value: "/backgrounds/fire.jpg" },
  { id: "brain", label: "Neural", thumb: "/backgrounds/brain.jpg", value: "/backgrounds/brain.jpg" },
] as const

/* ── Theme options ── */

const THEMES: { value: ColorTheme; label: string; swatch: string[] }[] = [
  { value: "default", label: "Cosmos", swatch: ["#6366f1", "#f59e0b", "#22d3a7"] },
  { value: "fire", label: "Fire", swatch: ["#ef4444", "#f97316", "#eab308"] },
  { value: "ice", label: "Ice", swatch: ["#38bdf8", "#818cf8", "#67e8f9"] },
]

/* ── Component ── */

export function PagePreferences() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pagePrefs = useGraphInteraction((s) => s.pagePrefs)
  const setPagePrefs = useGraphInteraction((s) => s.setPagePrefs)

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

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-surface text-muted hover:text-foreground/80 hover:border-border-bright transition-all duration-200 flex items-center gap-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Preferences
      </button>

      {/* Popup panel */}
      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 glass rounded-xl border border-border shadow-2xl glow-border w-[280px]">
          {/* ── Theme ── */}
          <Section label="Theme">
            <div className="flex gap-2">
              {THEMES.map((t) => {
                const isActive = pagePrefs.colorTheme === t.value
                return (
                  <button
                    key={t.value}
                    onClick={() => setPagePrefs({ colorTheme: t.value })}
                    className={`flex-1 flex flex-col items-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-medium transition-all duration-150 border ${
                      isActive
                        ? "bg-accent-purple/10 text-accent-purple border-accent-purple/30"
                        : "text-foreground/60 hover:bg-surface-hover border-transparent"
                    }`}
                  >
                    <div className="flex gap-0.5">
                      {t.swatch.map((c, i) => (
                        <span key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
                      ))}
                    </div>
                    {t.label}
                  </button>
                )
              })}
            </div>
          </Section>

          <Divider />

          {/* ── Cloud Font ── */}
          <Section label="Cloud Font">
            <select
              value={pagePrefs.cloudFont}
              onChange={(e) => setPagePrefs({ cloudFont: e.target.value as CloudFont })}
              className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-surface text-foreground/80 hover:border-border-bright transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent-purple/50 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b6b80' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                paddingRight: "28px",
              }}
            >
              {CLOUD_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Section>

          <Divider />

          {/* ── Background ── */}
          <Section label="Background">
            <div className="grid grid-cols-5 gap-1.5">
              {BACKGROUNDS.map((bg) => {
                const isActive = bg.value === pagePrefs.background
                return (
                  <button
                    key={bg.id}
                    onClick={() => setPagePrefs({ background: bg.value })}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                      isActive
                        ? "border-accent-purple shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                        : "border-border hover:border-border-bright"
                    }`}
                    title={bg.label}
                  >
                    {bg.thumb ? (
                      <span
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${bg.thumb})` }}
                      />
                    ) : (
                      <span className="absolute inset-0 bg-background flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </Section>
        </div>
      )}
    </div>
  )
}

/* ── Helper sub-components ── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-widest text-muted mb-2">{label}</p>
      {children}
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-border mx-3" />
}
