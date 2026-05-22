import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import PurchaseOrderForm from "../../purchase-order-form"

export default async function EditPurchaseOrderPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: {
      id: params.id,
      organizationId: session.user.organizationId
    },
    include: {
      lineItems: true
    }
  })

  if (!purchaseOrder) notFound()

  // Only DRAFT orders should be editable
  if (purchaseOrder.status !== "DRAFT") {
    redirect(`/purchases/${params.id}`)
  }

  const initialData = {
    id: purchaseOrder.id,
    vendorId: purchaseOrder.vendorId,
    poNumber: purchaseOrder.poNumber,
    lineItems: purchaseOrder.lineItems.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))
  }

  return <PurchaseOrderForm initialData={initialData} />
}
