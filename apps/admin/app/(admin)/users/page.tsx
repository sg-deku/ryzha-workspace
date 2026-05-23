import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { UserActions } from "./user-actions"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) redirect("/login")

  const users = await prisma.user.findMany({
    where: {
      isSuperAdmin: false
    },
    include: {
      organizations: {
        include: {
          organization: {
            select: { id: true, name: true, slug: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
  })

  const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    ACTIVE: "success",
    PENDING: "warning",
    SUSPENDED: "destructive",
    INACTIVE: "secondary",
  }

  return (
    <>
      <Header title="Users" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{users.length} total users</p>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organizations</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                return (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[user.status] ?? "secondary"}>{user.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {user.organizations.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.organizations.map((uo) => (
                            <Badge key={uo.organization.id} variant="outline" className="text-xs font-normal">
                              {uo.organization.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <UserActions userId={user.id} userName={user.name || user.email} />
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
