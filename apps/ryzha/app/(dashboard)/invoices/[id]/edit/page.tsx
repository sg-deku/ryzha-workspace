import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { InvoiceForm } from "@/components/invoices/invoice-form"

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const invoice = await prisma.invoice.findUnique({
    where: {
      id: params.id,
      organizationId: session.user.organizationId
    },
    include: {
      lineItems: true
    }
  })

  if (!invoice) notFound()

  if (invoice.status !== "DRAFT") {
    redirect(`/invoices/${params.id}`)
  }

  const initialData = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    clientName: invoice.clientName,
    clientEmail: invoice.clientEmail,
    clientAddress: invoice.clientAddress as any,
    lineItems: invoice.lineItems.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      amount: item.amount
    })),
    subtotal: invoice.subtotal,
    totalTax: invoice.totalTax,
    total: invoice.total
  }

  return <InvoiceForm initialData={initialData} />
}
