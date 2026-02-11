import { loadBonfiresGraph } from "@/lib/bonfires/adapter"

export async function GET() {
  const apiUrl = process.env.BONFIRES_API_URL
  const bonfireId = process.env.BONFIRES_BONFIRE_ID
  const agentId = process.env.BONFIRES_AGENT_ID

  const config =
    apiUrl && bonfireId && agentId
      ? { apiUrl, bonfireId, agentId }
      : undefined

  try {
    const graph = await loadBonfiresGraph(config)
    return Response.json(graph)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: message }, { status: 502 })
  }
}
