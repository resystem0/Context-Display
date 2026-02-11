export type NodeGroup = "activity" | "tag" | "actor" | "unknown"

export type GraphNode = {
  id: string
  label: string
  group: NodeGroup
  weight?: number
  metadata?: Record<string, unknown>
}

export type GraphEdge = {
  source: string
  target: string
  weight?: number
  type?: string
}

export type GraphData = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
