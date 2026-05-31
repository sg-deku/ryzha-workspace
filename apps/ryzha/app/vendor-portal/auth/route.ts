import { NextRequest, NextResponse } from "next/server"
import { validatePortalToken, touchPortalSession } from "@/lib/vendor-portal/auth"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(new URL("/vendor-portal/expired", req.url))
  }

  const session = await validatePortalToken(token)
  if (!session) {
    return NextResponse.redirect(new URL("/vendor-portal/expired", req.url))
  }

  await touchPortalSession(token)

  const response = NextResponse.redirect(new URL("/vendor-portal/dashboard", req.url))
  response.cookies.set("vp_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
  })

  return response
}
