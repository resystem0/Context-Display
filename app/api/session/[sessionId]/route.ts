import { NextRequest, NextResponse } from "next/server"
import {
  getSession,
  createSession,
  patchSession,
} from "@/lib/server/sessionStore"

type Params = { params: Promise<{ sessionId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { sessionId } = await params
  const session = getSession(sessionId)
  if (!session) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(session)
}

export async function POST(req: NextRequest, { params }: Params) {
  const { sessionId } = await params
  const body = await req.json()

  // Auto-create session on first POST
  if (!getSession(sessionId)) createSession(sessionId)

  const updated = patchSession(sessionId, body)
  if (!updated) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(updated)
}
