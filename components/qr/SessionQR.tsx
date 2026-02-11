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
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 shadow-md text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
      >
        {expanded ? "Hide QR" : "QR Remote"}
      </button>

      {expanded && url && (
        <div className="mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 shadow-lg">
          <QRCodeSVG value={url} size={160} />
          <p className="mt-2 text-xs text-neutral-500 text-center max-w-[160px] break-all">
            {url}
          </p>
        </div>
      )}
    </div>
  )
}
