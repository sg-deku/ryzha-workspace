import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import SalesOrderForm from "../../sales-order-form"

export default async function EditSalesOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const salesOrder = await prisma.salesOrder.findUnique({
    where: {
      id,
      organizationId: session.user.organizationId
    },
    include: {
      lineItems: true
    }
  })

  if (!salesOrder) notFound()

  if (salesOrder.status !== "DRAFT") {
    redirect(`/sales-orders/${id}`)
  }

  const initialData = {
    id: salesOrder.id,
    customerId: salesOrder.customerId,
    orderNumber: salesOrder.orderNumber,
    lineItems: salesOrder.lineItems.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))
  }

  return <SalesOrderForm initialData={initialData} />
}
