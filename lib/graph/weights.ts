import { GraphData, GraphNode } from "./types"

export type WeightedNode = GraphNode & { weight: number }

export function computeNodeWeights(
  graph: GraphData,
  filter: string[] = []
): WeightedNode[] {
  const map = new Map<string, WeightedNode>()

  graph.nodes.forEach((n) => {
    if (filter.length && !filter.includes(n.group)) return
    map.set(n.id, { ...n, weight: 0 })
  })

  graph.edges.forEach((e) => {
    const src = map.get(e.source)
    if (src) src.weight++
    const tgt = map.get(e.target)
    if (tgt) tgt.weight++
  })

  return Array.from(map.values()).sort((a, b) => b.weight - a.weight)
}
