import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { NewDebitMemoForm } from "./new-debit-memo-form"

export const dynamic = "force-dynamic"

export default async function NewVendorDebitMemoPage({
  searchParams,
}: {
  searchParams: Promise<{ vendorId?: string; vendorInvoiceId?: string }>
}) {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const { vendorId, vendorInvoiceId } = await searchParams

  const [vendors, preselectedInvoice] = await Promise.all([
    prisma.vendor.findMany({
      where: { organizationId: session.user.organizationId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    vendorInvoiceId
      ? prisma.vendorInvoice.findFirst({
          where: { id: vendorInvoiceId, organizationId: session.user.organizationId },
          select: { id: true, invoiceNumber: true, amount: true, vendorId: true },
        })
      : null,
  ])

  return (
    <div className="flex-1 p-8 pt-6 max-w-2xl">
      <NewDebitMemoForm
        vendors={vendors}
        defaultVendorId={vendorId || preselectedInvoice?.vendorId || ""}
        defaultVendorInvoiceId={vendorInvoiceId || ""}
      />
    </div>
  )
}
