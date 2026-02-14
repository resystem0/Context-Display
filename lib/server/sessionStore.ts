export type SessionState = {
  selectedNodeId?: string
  zoomState: "overview" | "cluster" | "detail"
  autoPlay: boolean
  path: string[]
  updatedAt: number
}

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
  partial: Partial<Pick<SessionState, "selectedNodeId" | "zoomState" | "autoPlay">>,
): SessionState | undefined {
  let session = sessions.get(id)
  if (!session) return undefined

  const prevNodeId = session.selectedNodeId

  session = { ...session, ...partial, updatedAt: Date.now() }

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
