import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function hasPermission(permissionName: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return false

  const userOrg = await prisma.userOrganization.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: session.user.organizationId
      }
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  })

  if (!userOrg) return false

  return userOrg.role.permissions.some(rp => rp.permission.name === permissionName)
}
