import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { InvoiceDetail } from "@/components/invoices/invoice-detail"

export const dynamic = 'force-dynamic'

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

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

  return <InvoiceDetail invoice={JSON.parse(JSON.stringify(invoice))} />
}
