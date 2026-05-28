import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Upload } from "lucide-react"
import { InvoiceTable } from "@/components/invoices/invoice-table"
import { Card, CardContent } from "@/components/ui/card"
import { PageShell } from "@/components/ui/page-shell"

export const dynamic = "force-dynamic"

export default async function InvoicesPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const orgId = session.user.organizationId

  const [invoices, draftCount, overdueCount, totalRevenue] = await Promise.all([
    prisma.invoice.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.count({ where: { organizationId: orgId, status: "DRAFT" } }),
    prisma.invoice.count({
      where: { organizationId: orgId, status: "SENT", dueDate: { lt: new Date() } },
    }),
    prisma.invoice.aggregate({ where: { organizationId: orgId, status: "PAID" }, _sum: { total: true } }),
  ])

  return (
    <PageShell
      title="Invoices"
      subtitle="Manage your client billing and payment collection."
      newHref="/invoices/new"
      newLabel="New Invoice"
      actions={[
        { label: "Upload CSV", href: "/invoices/upload", variant: "outline", icon: <Upload className="h-4 w-4" /> },
      ]}
      kpis={[
        { label: "Total Invoices", value: invoices.length },
        { label: "Draft", value: draftCount },
        { label: "Overdue", value: overdueCount },
        { label: "Revenue Collected", value: `$${(totalRevenue._sum.total ?? 0).toLocaleString()}` },
      ]}
    >
      <Card>
        <CardContent className="pt-4">
          <InvoiceTable initialInvoices={JSON.parse(JSON.stringify(invoices))} />
        </CardContent>
      </Card>
    </PageShell>
  )
}
