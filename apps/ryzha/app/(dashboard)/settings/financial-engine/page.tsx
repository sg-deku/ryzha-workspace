import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import FinancialEngineClient from "./financial-engine-client"


export const dynamic = "force-dynamic";

export default async function FinancialEnginePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId: session.user.organizationId },
  })

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Financial Engine</h2>
      </div>
      <FinancialEngineClient initialData={settings} />
    </div>
  )
}
