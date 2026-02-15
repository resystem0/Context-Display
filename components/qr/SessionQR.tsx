"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"

export function SessionQR({ sessionId }: { sessionId: string }) {
  const [expanded, setExpanded] = useState(false)

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/remote/${sessionId}`
      : ""

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-surface text-muted hover:text-foreground/80 hover:border-border-bright transition-all duration-200"
      >
        {expanded ? "Hide QR" : "QR Remote"}
      </button>

      {expanded && url && (
        <div className="absolute top-full right-0 mt-2 z-50 glass rounded-xl border border-border p-4 shadow-2xl glow-border">
          <div className="bg-white rounded-lg p-2">
            <QRCodeSVG value={url} size={140} />
          </div>
          <p className="mt-2 text-[10px] text-muted text-center max-w-[156px] break-all leading-relaxed">
            {url}
          </p>
        </div>
      )}
    </div>
  )
}
