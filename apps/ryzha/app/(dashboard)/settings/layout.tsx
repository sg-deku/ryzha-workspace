export const dynamic = "force-dynamic"

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }

  // Fetch user permissions for the current organization
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

  const permissions = userOrg?.role?.permissions.map(rp => rp.permission.name) || []

  // Check if the user has any admin-level permission required for settings
  const hasSettingsAccess = permissions.some(p => 
    ["org:manage", "users:manage", "roles:manage", "financial:manage"].includes(p)
  )

  // If not an admin by role name AND doesn't have specific permissions, redirect
  const isAdminRole = session.user.role.toUpperCase() === 'ADMIN'
  
  if (!isAdminRole && !hasSettingsAccess) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
