import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Clock } from "lucide-react"

export default async function PendingApprovalPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")
  if (session.user.orgStatus === "ACTIVE") redirect("/dashboard")
  if (session.user.orgStatus === "REJECTED") {
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
      </div>
    </div>
  )
}
