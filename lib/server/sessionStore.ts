import {
  AllViewSettings,
  DEFAULT_VIEW_SETTINGS,
} from "@/lib/graph/viewSettings"

export type SessionState = {
  selectedNodeId?: string
  highlightedNodeIds: string[]
  viewMode: string
  viewSettings: AllViewSettings
  zoomState: "overview" | "cluster" | "detail"
  autoPlay: boolean
  path: string[]
  updatedAt: number
}

export type SessionPatch = Partial<
  Pick<
    SessionState,
    | "selectedNodeId"
    | "highlightedNodeIds"
    | "viewMode"
    | "viewSettings"
    | "zoomState"
    | "autoPlay"
  >
>

const EXPIRY_MS = 30 * 60 * 1000 // 30 minutes

const sessions = new Map<string, SessionState>()

function purgeExpired() {
  const now = Date.now()
  for (const [id, s] of sessions) {
    if (now - s.updatedAt > EXPIRY_MS) sessions.delete(id)
  }
}

export function createSession(id: string): SessionState {
  purgeExpired()
  const state: SessionState = {
    selectedNodeId: undefined,
    highlightedNodeIds: [],
    viewMode: "force",
    viewSettings: DEFAULT_VIEW_SETTINGS,
    zoomState: "overview",
    autoPlay: true,
    path: [],
    updatedAt: Date.now(),
  }
  sessions.set(id, state)
  return state
}

export function getSession(id: string): SessionState | undefined {
  purgeExpired()
  return sessions.get(id)
}

export function patchSession(
  id: string,
  partial: SessionPatch,
): SessionState | undefined {
  let session = sessions.get(id)
  if (!session) return undefined

  const prevNodeId = session.selectedNodeId

  // Deep-merge viewSettings (two-level: view → settings within that view)
  let mergedViewSettings = session.viewSettings
  if (partial.viewSettings) {
    const base = { ...session.viewSettings } as Record<string, Record<string, unknown>>
    for (const key of Object.keys(partial.viewSettings)) {
      base[key] = {
        ...(session.viewSettings[key as keyof AllViewSettings] as Record<string, unknown>),
        ...(partial.viewSettings[key as keyof AllViewSettings] as Record<string, unknown>),
      }
    }
    mergedViewSettings = base as unknown as AllViewSettings
  }

  const { viewSettings: _vs, ...restPartial } = partial
  session = {
    ...session,
    ...restPartial,
    viewSettings: mergedViewSettings,
    updatedAt: Date.now(),
  }

  // Append to path when selectedNodeId changes
  if (
    partial.selectedNodeId !== undefined &&
    partial.selectedNodeId !== prevNodeId
  ) {
    session.path = [...session.path, partial.selectedNodeId]
  }

  sessions.set(id, session)
  return session
}
