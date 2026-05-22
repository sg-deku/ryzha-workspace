import { MainLayout } from "@/components/layouts/main-layout"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.orgStatus && session.user.orgStatus !== "ACTIVE") {
    redirect("/pending-approval")
  }

  return <MainLayout>{children}</MainLayout>
}
