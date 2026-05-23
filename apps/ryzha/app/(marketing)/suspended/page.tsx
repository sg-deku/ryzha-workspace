import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AlertTriangle, LogOut } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function SuspendedPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")
  if (session.user.orgStatus === "ACTIVE") redirect("/dashboard")
  
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Account Suspended</h1>
          <p className="text-muted-foreground text-lg">
            Your account is suspended, contact the admin for more details.
          </p>
        </div>
        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
          Signed in as <span className="font-medium text-foreground">{session.user.email}</span>
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
