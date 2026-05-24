import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Clock, LogOut } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function PendingApprovalPage() {
  const session = await getSession()

  if (!session?.user?.organizationId) redirect("/login")

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { status: true, onboardingCompleted: true },
  })

  if (org?.status === "ACTIVE") {
    if (!org.onboardingCompleted) redirect("/onboarding")
    redirect("/dashboard")
  }
  if (org?.status === "SUSPENDED") redirect("/suspended")

  if (org?.status === "REJECTED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Clock className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Application Rejected</h1>
          <p className="text-muted-foreground">
            Your organization application was not approved. Please contact support for more information.
          </p>
          <div className="pt-4">
            <Button variant="outline" asChild>
              <Link href="/logout" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Awaiting Approval</h1>
        <p className="text-muted-foreground">
          Your organization has been registered and is currently under review.
          You&apos;ll be able to access your dashboard once an admin approves your account.
        </p>
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium">{session.user.email}</span>
        </p>
        <div className="pt-4">
          <Button variant="outline" asChild>
            <Link href="/logout" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
