import { NextRequest, NextResponse } from "next/server"
import { getPath } from "@/lib/server/pathStore"

type Params = { params: Promise<{ pathId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { pathId } = await params
  const saved = getPath(pathId)

  if (!saved) return NextResponse.json(null, { status: 404 })

  const text = saved.path.join("\n")
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="path-${pathId}.txt"`,
    },
  })
}
