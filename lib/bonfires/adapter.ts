import { GraphData, GraphNode, GraphEdge, NodeGroup } from "@/lib/graph/types"
import { MOCK_GRAPH } from "./mock"

interface DelveEntity {
  uuid: string
  name: string
  node_type: string
  labels?: string[]
  [key: string]: unknown
}

interface DelveEpisode {
  uuid: string
  name: string
  node_type: string
  source?: string
  content?: string
  [key: string]: unknown
}

interface DelveEdge {
  uuid: string
  name: string
  fact?: string
  source_node_uuid: string
  target_node_uuid: string
  [key: string]: unknown
}

interface DelveResponse {
  episodes: DelveEpisode[]
  entities: DelveEntity[]
  edges: DelveEdge[]
}

function entityGroup(labels?: string[]): NodeGroup {
  if (!labels || labels.length === 0) return "activity"
  const set = new Set(labels.map((l) => l.toLowerCase()))
  if (set.has("user")) return "actor"
  if (set.has("taxonomylabel")) return "tag"
  return "activity"
}

function normalizeDelve(raw: DelveResponse): GraphData {
  const nodes: GraphNode[] = []
  const nodeIds = new Set<string>()

  for (const entity of raw.entities) {
    nodeIds.add(entity.uuid)
    nodes.push({
      id: entity.uuid,
      label: entity.name || "Unnamed",
      group: entityGroup(entity.labels),
      metadata: entity,
    })
  }

  for (const episode of raw.episodes) {
    nodeIds.add(episode.uuid)
    nodes.push({
      id: episode.uuid,
      label: episode.name || "Unnamed",
      group: "activity",
      metadata: episode,
    })
  }

  const edges: GraphEdge[] = []
  for (const edge of raw.edges) {
    if (nodeIds.has(edge.source_node_uuid) && nodeIds.has(edge.target_node_uuid)) {
      edges.push({
        source: edge.source_node_uuid,
        target: edge.target_node_uuid,
        type: edge.name || undefined,
      })
    }
  }

  return { nodes, edges }
}

function enrich(graph: GraphData): GraphData {
  const degree: Record<string, number> = {}
  graph.nodes.forEach((n) => (degree[n.id] = 0))
  graph.edges.forEach((e) => {
    if (e.source in degree) degree[e.source]++
    if (e.target in degree) degree[e.target]++
  })

  return {
    nodes: graph.nodes.map((n) => ({
      ...n,
      weight: n.weight ?? degree[n.id],
    })),
    edges: graph.edges,
  }
}

export async function loadBonfiresGraph(config?: {
  apiUrl: string
  bonfireId: string
  agentId: string
}): Promise<GraphData> {
  if (!config) {
    return enrich(MOCK_GRAPH)
  }

  const res = await fetch(`${config.apiUrl}/delve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      query: "*",
      bonfire_id: config.bonfireId,
      agent_id: config.agentId,
      num_results: 30,
    }),
  })

  if (!res.ok) {
    throw new Error(`Bonfires fetch failed: ${res.status}`)
  }

  const raw: DelveResponse = await res.json()

  if (!Array.isArray(raw.entities) && !Array.isArray(raw.episodes)) {
    throw new Error("Invalid Bonfires payload: missing entities[] or episodes[]")
  }

  return enrich(
    normalizeDelve({
      entities: raw.entities ?? [],
      episodes: raw.episodes ?? [],
      edges: raw.edges ?? [],
    })
  )
}
