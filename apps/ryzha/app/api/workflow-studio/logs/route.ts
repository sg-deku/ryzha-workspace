import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic";

function toRichLogs(raw: any[]): { agent: string; message: string; timestamp: string }[] {
  return raw.map((log: any) => ({
    agent: log.agent ?? "System",
    message: log.message ?? "",
    timestamp: log.timestamp ?? new Date().toISOString(),
  }))
}

function wfStatus(status: string | null | undefined): "completed" | "error" | "running" {
  if (status === "completed") return "completed"
  if (status === "error") return "error"
  return "running"
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const executionId = searchParams.get("executionId")

  if (!executionId) {
    return NextResponse.json({ error: "Missing executionId" }, { status: 400 })
  }

  const orgId = session.user.organizationId;

  const transaction = await prisma.transaction.findUnique({ where: { id: executionId } });
  if (transaction && transaction.organizationId === orgId) {
    return NextResponse.json({
      logs: Array.isArray(transaction.agentLogs) ? toRichLogs(transaction.agentLogs) : [],
      status: wfStatus(transaction.workflowStatus),
    });
  }

  const vendorInvoice = await prisma.vendorInvoice.findUnique({ where: { id: executionId } });
  if (vendorInvoice && vendorInvoice.organizationId === orgId) {
    return NextResponse.json({
      logs: Array.isArray(vendorInvoice.agentLogs) ? toRichLogs(vendorInvoice.agentLogs as any[]) : [],
      status: wfStatus(vendorInvoice.workflowStatus),
    })
  }

  const salesOrder = await prisma.salesOrder.findUnique({ where: { id: executionId } });
  if (salesOrder && salesOrder.organizationId === orgId) {
    return NextResponse.json({
      logs: Array.isArray(salesOrder.agentLogs) ? toRichLogs(salesOrder.agentLogs as any[]) : [],
      status: wfStatus(salesOrder.workflowStatus),
    })
  }

  return NextResponse.json({ logs: [], status: "idle" });
}
