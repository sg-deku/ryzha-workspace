import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { disposeAsset } from "@/lib/fixed-assets/depreciation-engine"

export const dynamic = "force-dynamic"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { disposalDate, disposalProceeds, disposalNotes } = await req.json()
    if (!disposalDate) return NextResponse.json({ error: "disposalDate is required" }, { status: 400 })

    const asset = await prisma.fixedAsset.findFirst({
      where: { id: params.id, organizationId: session.user.organizationId },
      select: { id: true },
    })
    if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const result = await disposeAsset(params.id, {
      disposalDate: new Date(disposalDate),
      proceeds: Number(disposalProceeds ?? 0),
      notes: disposalNotes ?? undefined,
    })

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
