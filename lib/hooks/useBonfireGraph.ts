import useSWR from "swr"
import { GraphData } from "@/lib/graph/types"

async function fetchBonfiresData(): Promise<GraphData> {
  // Always use the Next.js API route to avoid CORS issues
  const res = await fetch("/api/bonfire/activities")
  if (!res.ok) throw new Error("Failed to fetch graph data")
  return res.json()
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
