import OrganizationSettingsPage from "./page-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) redirect("/login")

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    include: {
      financialSettings: true
    }
  })

  if (!org) redirect("/login")

  return <OrganizationSettingsPage organization={org} />
}
