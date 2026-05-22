import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = session.user.organizationId;

  // Fetch recent executions from Transaction, VendorInvoice, SalesOrder
  const transactions = await prisma.transaction.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  const vendorInvoices = await prisma.vendorInvoice.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  const salesOrders = await prisma.salesOrder.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  const history = [
    ...transactions.map(t => ({
      id: t.id,
      type: "stripe",
      startedAt: t.createdAt.toISOString(),
      status: t.workflowStatus === "completed" ? "COMPLETED" : t.workflowStatus === "error" ? "ERROR" : "RUNNING"
    })),
    ...vendorInvoices.map(v => ({
      id: v.id,
      type: "p2p",
      startedAt: v.createdAt.toISOString(),
      status: v.status === "MATCHED" || v.status === "PAID" ? "COMPLETED" : "PENDING"
    })),
    ...salesOrders.map(s => ({
      id: s.id,
      type: "o2c",
      startedAt: s.createdAt.toISOString(),
      status: s.status === "PAID" ? "COMPLETED" : "PENDING"
    }))
  ];

  // Sort by startedAt desc
  history.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return NextResponse.json(history.slice(0, 50));
}
