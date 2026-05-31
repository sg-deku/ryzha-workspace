import { redirect } from "next/navigation"
import { validatePortalToken, touchPortalSession } from "@/lib/vendor-portal/auth"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export default async function VendorPortalAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) redirect("/vendor-portal/expired")

  const session = await validatePortalToken(token)
  if (!session) redirect("/vendor-portal/expired")

  await touchPortalSession(token)

  const cookieStore = await cookies()
  cookieStore.set("vp_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 72 * 60 * 60,
    path: "/vendor-portal",
  })

  redirect("/vendor-portal/dashboard")
}
