import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import VendorForm from "../../vendor-form"

export default async function EditVendorPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const vendor = await prisma.vendor.findUnique({
    where: {
      id: params.id,
      organizationId: session.user.organizationId
    }
  })

  if (!vendor) notFound()

  return <VendorForm initialData={vendor} />
}
