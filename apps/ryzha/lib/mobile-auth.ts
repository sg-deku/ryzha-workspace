import { SignJWT, jwtVerify } from "jose"
import { prisma } from "./prisma"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

export interface MobileTokenPayload {
  id: string
  email: string
  name: string | null
  organizationId: string
  role: string
  orgStatus: string
}

export async function signMobileToken(payload: MobileTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret)
}

export async function verifyMobileToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as MobileTokenPayload
  } catch {
    return null
  }
}

export async function getMobileSession(req: Request): Promise<MobileTokenPayload | null> {
  const auth = req.headers.get("Authorization")
  if (!auth?.startsWith("Bearer ")) return null
  const token = auth.slice(7)
  return verifyMobileToken(token)
}
