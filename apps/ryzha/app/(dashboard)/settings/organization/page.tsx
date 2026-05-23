import OrganizationSettingsPage from "./page-client"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getSession()
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
