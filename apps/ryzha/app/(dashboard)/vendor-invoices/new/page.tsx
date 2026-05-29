import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import VendorInvoiceForm from "../vendor-invoice-form"

export const dynamic = "force-dynamic"

export default async function NewVendorInvoicePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return <VendorInvoiceForm />
}
