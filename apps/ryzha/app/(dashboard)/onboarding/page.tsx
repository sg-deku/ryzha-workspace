import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { OnboardingWizard } from "./onboarding-wizard"

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")
  
  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId }
  })
  
  if (org?.onboardingCompleted) redirect("/dashboard")
  
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to Ryzha</h1>
        <p className="text-muted-foreground text-lg">Let's set up your organization's financial brain.</p>
      </div>
      <OnboardingWizard />
    </div>
  )
}
