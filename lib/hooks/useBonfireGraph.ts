import useSWR from "swr"
import { GraphData } from "@/lib/graph/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useBonfireGraph() {
  const { data, error, isLoading } = useSWR<GraphData>(
    "/api/bonfire/activities",
    fetcher
  )

  return { graph: data, error, isLoading }
}
