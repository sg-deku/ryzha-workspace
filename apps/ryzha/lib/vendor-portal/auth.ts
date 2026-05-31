import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

export const PORTAL_INVITE_TTL_HOURS = 72

export async function createPortalSession(vendorId: string, email: string) {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + PORTAL_INVITE_TTL_HOURS * 60 * 60 * 1000)

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

const PERMANENT_EXPIRY = new Date("2099-01-01T00:00:00.000Z")

export async function touchPortalSession(token: string) {
  await prisma.vendorPortalSession.update({
    where: { token },
    data: {
      usedAt: new Date(),
      expiresAt: PERMANENT_EXPIRY,
    },
  })
}

export function buildPortalUrl(token: string, baseUrl: string) {
  return `${baseUrl}/vendor-portal/auth?token=${token}`
}
