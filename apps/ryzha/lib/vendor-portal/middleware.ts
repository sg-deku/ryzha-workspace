import { NextRequest } from "next/server"
import { validatePortalToken } from "./auth"

export async function getPortalSession(req: NextRequest) {
  const token = req.cookies.get("vp_token")?.value
  if (!token) return null
  return validatePortalToken(token)
}
