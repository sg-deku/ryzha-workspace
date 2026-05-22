import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InvoiceTable } from "@/components/invoices/invoice-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage your client billing and payments.</p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceTable initialInvoices={JSON.parse(JSON.stringify(invoices))} />
        </CardContent>
      </Card>
    </div>
  )
}
