import { GraphData } from "./types"

export function getNeighborIds(graph: GraphData, nodeId: string): string[] {
  const ids = new Set<string>()

  graph.edges.forEach((e) => {
    if (e.source === nodeId) ids.add(e.target)
    if (e.target === nodeId) ids.add(e.source)
  })

  return Array.from(ids)
}

export function getNeighborAtIndex(
  graph: GraphData,
  nodeId: string,
  currentIndex: number,
): { neighborId: string; nextIndex: number } | undefined {
  const neighbors = getNeighborIds(graph, nodeId)
  if (neighbors.length === 0) return undefined
  const idx = currentIndex % neighbors.length
  return { neighborId: neighbors[idx], nextIndex: idx + 1 }
}
