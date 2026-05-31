import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

export const PORTAL_SESSION_TTL_HOURS = 72

export async function createPortalSession(vendorId: string, email: string) {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + PORTAL_SESSION_TTL_HOURS * 60 * 60 * 1000)

  const session = await prisma.vendorPortalSession.create({
    data: { vendorId, token, email, expiresAt },
  })

  return session
}

export async function validatePortalToken(token: string) {
  const session = await prisma.vendorPortalSession.findUnique({
    where: { token },
    include: { vendor: true },
  })

  if (!session) return null
  if (session.expiresAt < new Date()) return null

  return session
}

export async function touchPortalSession(token: string) {
  await prisma.vendorPortalSession.update({
    where: { token },
    data: { usedAt: new Date() },
  })
}

export function buildPortalUrl(token: string, baseUrl: string) {
  return `${baseUrl}/vendor-portal/auth?token=${token}`
}
