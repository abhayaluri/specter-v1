import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

export async function POST() {
  // TODO (Task 6): After creating a source, call /api/embed to generate embedding
  // Example:
  // await fetch('/api/embed', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ sourceId: newSource.id })
  // })
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
