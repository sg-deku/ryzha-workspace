import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SettingsClient } from "./settings-client"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const session = await getSession()
  if (!session?.user?.organizationId) redirect("/login")

  const [org, financialSettings, numberingSettings] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      include: { financialSettings: true },
    }),
    prisma.financialSettings.findUnique({
      where: { organizationId: session.user.organizationId },
    }),
    prisma.numberingSettings.findUnique({
      where: { organizationId: session.user.organizationId },
    }),
  ])

  if (!org) redirect("/login")

  return (
    <SettingsClient
      org={org}
      financialSettings={financialSettings}
      numberingSettings={numberingSettings}
      userRole={session.user.role ?? "member"}
    />
  )
}
