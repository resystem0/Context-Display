import { NextRequest, NextResponse } from "next/server"
import { savePath } from "@/lib/server/pathStore"

export async function POST(req: NextRequest) {
  const { sessionId, path } = await req.json()

  if (!sessionId || !Array.isArray(path)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const pathId = savePath(sessionId, path)
  return NextResponse.json({ pathId })
}
