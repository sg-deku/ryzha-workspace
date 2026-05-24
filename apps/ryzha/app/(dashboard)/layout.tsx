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

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { status: true, onboardingCompleted: true },
  })

  if (!org || org.status === "SUSPENDED") redirect("/suspended")
  if (org.status !== "ACTIVE") redirect("/pending-approval")
  if (!org.onboardingCompleted) redirect("/onboarding")

  return <MainLayout session={session}>{children}</MainLayout>
}
