import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { SettingsTabs } from "@/components/settings/settings-tabs"

async function getData(organizationId: string) {
  const [org, members, architecture] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, status: true },
    }),
    prisma.userOrganization.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
        role: { select: { name: true } },
      },
      orderBy: { userId: "asc" },
    }),
    prisma.financialArchitecture.findUnique({
      where: { organizationId },
    }),
  ])

  return { org, members, architecture }
}

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const { org, members, architecture } = await getData(session.user.organizationId)

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your workspace, financial configuration, team, and notification preferences.
        </p>
      </div>

      <SettingsTabs
        org={org}
        members={members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role?.name ?? "MEMBER",
          joinedAt: m.user.createdAt,
        }))}
        architecture={architecture}
        currentUserId={session.user.id}
      />
    </div>
  )
}
