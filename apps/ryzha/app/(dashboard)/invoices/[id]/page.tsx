import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { InvoiceDetail } from "@/components/invoices/invoice-detail"

export const dynamic = 'force-dynamic'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const invoice = await prisma.invoice.findUnique({
    where: { 
      id,
      organizationId: session.user.organizationId
    },
    include: {
      lineItems: true,
      payments: { orderBy: { paymentDate: "desc" } },
      creditNotes: { orderBy: { issueDate: "desc" } },
    }
  })

  if (!invoice) notFound()

  return <InvoiceDetail invoice={JSON.parse(JSON.stringify(invoice))} />
}
