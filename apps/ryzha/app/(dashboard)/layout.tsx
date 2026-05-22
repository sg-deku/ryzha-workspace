import { MainLayout } from "@/components/layouts/main-layout"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.organizationId) {
    redirect("/login")
  }

  if (session.user.orgStatus && session.user.orgStatus !== "ACTIVE") {
    redirect("/pending-approval")
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId }
  })

  if (org && !org.onboardingCompleted) {
    redirect("/onboarding")
  }

  return <MainLayout>{children}</MainLayout>
}
