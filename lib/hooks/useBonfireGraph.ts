import useSWR from "swr"
import { GraphData } from "@/lib/graph/types"
import { loadBonfiresGraph } from "@/lib/bonfires/adapter"

async function fetchBonfiresData(): Promise<GraphData> {
  const apiUrl = process.env.NEXT_PUBLIC_BONFIRES_API_URL
  const bonfireId = process.env.NEXT_PUBLIC_BONFIRES_BONFIRE_ID
  const agentId = process.env.NEXT_PUBLIC_BONFIRES_AGENT_ID

  if (!apiUrl || !bonfireId || !agentId) {
    // Fallback to server API route if env vars not available
    const res = await fetch("/api/bonfire/activities")
    if (!res.ok) throw new Error("Failed to fetch graph data")
    return res.json()
  }

  // Fetch directly from Bonfires API
  return loadBonfiresGraph({ apiUrl, bonfireId, agentId })
}

export function useBonfireGraph() {
  const { data, error, isLoading } = useSWR<GraphData>(
    "bonfire-graph",
    fetchBonfiresData,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  return { graph: data, error, isLoading }
}
