import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import VendorInvoiceForm from "../../vendor-invoice-form"

export default async function EditVendorInvoicePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const vendorInvoice = await prisma.vendorInvoice.findUnique({
    where: {
      id: params.id,
      organizationId: session.user.organizationId
    },
    include: {
      lineItems: true
    }
  })

  if (!vendorInvoice) notFound()

  // Only PENDING invoices should be editable (Assuming PENDING is equivalent to DRAFT)
  if (vendorInvoice.status !== "PENDING") {
    redirect(`/vendor-invoices/${params.id}`)
  }

  const initialData = {
    id: vendorInvoice.id,
    vendorId: vendorInvoice.vendorId,
    invoiceNumber: vendorInvoice.invoiceNumber,
    purchaseOrderId: vendorInvoice.purchaseOrderId,
    lineItems: vendorInvoice.lineItems.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))
  }

  return <VendorInvoiceForm initialData={initialData} />
}
