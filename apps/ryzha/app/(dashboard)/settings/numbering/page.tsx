export const dynamic = "force-dynamic"

import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import NumberingSettingsClient from "./numbering-client"

export default async function NumberingSettingsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const settings = await prisma.numberingSettings.findUnique({
    where: { organizationId: session.user.organizationId },
  })

  return <NumberingSettingsClient settings={settings} />
}
