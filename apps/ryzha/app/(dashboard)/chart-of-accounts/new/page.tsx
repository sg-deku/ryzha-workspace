import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { CoaForm } from "../coa-form"

export const dynamic = "force-dynamic"

export default async function NewChartOfAccountPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const parentOptions = await prisma.chartOfAccounts.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, accountName: true, accountType: true },
    orderBy: [{ accountType: "asc" }, { accountName: "asc" }],
  })

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/chart-of-accounts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">New Account</h2>
      </div>
      <CoaForm mode="create" parentOptions={parentOptions} />
    </div>
  )
}
