import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import WorkflowStudioPage from "./page-client"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const [customers, vendors] = await Promise.all([
    prisma.customer.findMany({
      where: { organizationId: session.user.organizationId, status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    prisma.vendor.findMany({
      where: { organizationId: session.user.organizationId, status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
  ])

  return <WorkflowStudioPage customers={customers} vendors={vendors} />
}
