import { MainLayout } from "@/components/layouts/main-layout"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session || !session.user?.organizationId) {
    redirect("/login")
  }

  let org: { status: string; onboardingCompleted: boolean } | null = null
  try {
    org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { status: true, onboardingCompleted: true },
    })
  } catch {
    redirect("/login")
  }

  if (!org || org.status === "SUSPENDED") redirect("/suspended")
  if (!org.onboardingCompleted) redirect("/onboarding")
  if (org.status === "PENDING" || org.status === "REJECTED") redirect("/pending-approval")

  return <MainLayout session={session}>{children}</MainLayout>
}
