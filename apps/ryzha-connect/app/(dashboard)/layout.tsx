import { Sidebar } from "@/components/layouts/sidebar"
import { Header } from "@/components/layouts/header"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

async function getOrgName(organizationId: string): Promise<string | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  })
  return org?.name ?? null
}

async function needsOnboarding(organizationId: string): Promise<boolean> {
  const [connections, architecture] = await Promise.all([
    prisma.integrationConnection.count({ where: { organizationId } }),
    prisma.financialArchitecture.findUnique({ where: { organizationId }, select: { id: true } }),
  ])
  return connections === 0 && !architecture
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { organizationId } = session.user

  const shouldOnboard = await needsOnboarding(organizationId)
  if (shouldOnboard) {
    redirect("/onboarding")
  }

  const orgName = await getOrgName(organizationId)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header orgName={orgName} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
