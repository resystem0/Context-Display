import { randomUUID } from "crypto"

type SavedPath = {
  sessionId: string
  path: string[]
}

const paths = new Map<string, SavedPath>()

export function savePath(sessionId: string, path: string[]): string {
  const pathId = randomUUID()
  paths.set(pathId, { sessionId, path })
  return pathId
}

export function getPath(pathId: string): SavedPath | undefined {
  return paths.get(pathId)
}
