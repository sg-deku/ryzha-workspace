import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import ProductForm from "../../product-form"

export const dynamic = "force-dynamic"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const product = await prisma.product.findUnique({
    where: { id, organizationId: session.user.organizationId },
  })
  if (!product) notFound()

  return <ProductForm initialData={product} />
}
