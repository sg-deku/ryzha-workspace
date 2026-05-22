import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const executionId = searchParams.get("executionId")

  if (!executionId) {
    return NextResponse.json({ error: "Missing executionId" }, { status: 400 })
  }

  // Check which entity it belongs to
  const orgId = session.user.organizationId;

  // 1. Check Transaction (Stripe / O2C final flow)
  const transaction = await prisma.transaction.findUnique({
    where: { id: executionId }
  });

  if (transaction && transaction.organizationId === orgId) {
    let logs: string[] = [];
    if (Array.isArray(transaction.agentLogs)) {
      logs = transaction.agentLogs.map((log: any) => {
        return `[${log.agent}] ${log.message}`;
      });
    }
    return NextResponse.json({ 
      logs, 
      status: transaction.workflowStatus === "completed" ? "completed" : transaction.workflowStatus === "error" ? "error" : "running" 
    });
  }

  // 2. Check VendorInvoice (P2P flow)
  const vendorInvoice = await prisma.vendorInvoice.findUnique({
    where: { id: executionId }
  });

  if (vendorInvoice && vendorInvoice.organizationId === orgId) {
    let logs: string[] = []
    if (Array.isArray(vendorInvoice.agentLogs)) {
      logs = (vendorInvoice.agentLogs as any[]).map((log: any) => `[${log.agent}] ${log.message}`)
    }
    const wfStatus = vendorInvoice.workflowStatus
    return NextResponse.json({
      logs,
      status: wfStatus === "completed" ? "completed" : wfStatus === "error" ? "error" : "running",
    })
  }

  // 3. Check SalesOrder (O2C flow)
  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: executionId }
  });

  if (salesOrder && salesOrder.organizationId === orgId) {
    let logs: string[] = []
    if (Array.isArray(salesOrder.agentLogs)) {
      logs = (salesOrder.agentLogs as any[]).map((log: any) => `[${log.agent}] ${log.message}`)
    }
    const wfStatus = salesOrder.workflowStatus
    return NextResponse.json({
      logs,
      status: wfStatus === "completed" ? "completed" : wfStatus === "error" ? "error" : "running",
    })
  }

  return NextResponse.json({ logs: [], status: "idle" });
}