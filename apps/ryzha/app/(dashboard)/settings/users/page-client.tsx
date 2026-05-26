"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  Mail, 
  UserCog,
  Loader2,
  Shield,
  Settings2,
  Lock,
  Trash2,
  Ban,
  CheckCircle
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [permissionsList, setPermissionsList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Invite user state
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRoleId, setInviteRoleId] = useState("")

  // Edit user state
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editRoleId, setEditRoleId] = useState("")
  const [isEditingUser, setIsEditingUser] = useState(false)

  // New/Edit role state
  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [isSavingRole, setIsSavingRole] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [roleName, setRoleName] = useState("")
  const [roleDesc, setRoleDesc] = useState("")
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set())

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/roles"),
        fetch("/api/permissions")
      ])
      
      if (usersRes.ok) setUsers(await usersRes.json())
      if (rolesRes.ok) setRoles(await rolesRes.json())
      if (permsRes.ok) setPermissionsList(await permsRes.json())
    } catch (error) {
      toast.error("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          roleId: inviteRoleId
        })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to invite user")
      }
      toast.success("User invited successfully")
      setIsInviteOpen(false)
      setInviteName("")
      setInviteEmail("")
      setInviteRoleId("")
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsInviting(false)
    }
  }

  const handleUpdateUserRole = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsEditingUser(true)
    try {
      const res = await fetch(`/api/users/${editingUser.user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: editRoleId })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update user")
      }
      toast.success("User role updated")
      setEditingUser(null)
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsEditingUser(false)
    }
  }

  const handleUpdateUserStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update status")
      }
      toast.success(`User ${newStatus.toLowerCase()} successfully`)
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleRemoveUser = async (id: string) => {
    if (!confirm("Are you sure you want to remove this user from the organization?")) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
      if (!res.ok) {
         const error = await res.json()
         throw new Error(error.error || "Failed to remove user")
      }
      toast.success("User removed")
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const openNewRole = () => {
    setEditingRole(null)
    setRoleName("")
    setRoleDesc("")
    setSelectedPerms(new Set())
    setIsRoleOpen(true)
  }

  const openEditRole = (role: any) => {
    if (role.isSystem) return
    setEditingRole(role)
    setRoleName(role.name)
    setRoleDesc(role.description || "")
    const permIds = role.permissions?.map((p: any) => p.permissionId) || []
    setSelectedPerms(new Set(permIds))
    setIsRoleOpen(true)
  }

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingRole(true)
    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : "/api/roles"
      const method = editingRole ? "PUT" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roleName,
          description: roleDesc,
          permissionIds: Array.from(selectedPerms)
        })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to save role")
      }
      
      toast.success(editingRole ? "Role updated" : "Role created")
      setIsRoleOpen(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSavingRole(false)
    }
  }

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return
    try {
      const res = await fetch(`/api/roles/${id}`, { method: "DELETE" })
      if (!res.ok) {
         const error = await res.json()
         throw new Error(error.error || "Failed to delete role")
      }
      toast.success("Role deleted")
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const togglePermission = (id: string) => {
    const next = new Set(selectedPerms)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedPerms(next)
  }

  const filteredUsers = users.filter((u) => 
    u.user.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.user.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Manage your team members and their access levels.</p>
      </div>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Invite New User</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your organization.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="invite-name">Name</Label>
                      <Input id="invite-name" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="John Doe" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={inviteRoleId} onValueChange={setInviteRoleId} required>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isInviting || !inviteRoleId}>
                      {isInviting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Invite"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Edit User Role Dialog */}
          <Dialog open={!!editingUser} onOpenChange={(open: boolean) => !open && setEditingUser(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit User Role</DialogTitle>
                <DialogDescription>
                  Update the role for {editingUser?.user?.name || editingUser?.user?.email}.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateUserRole}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-role">Role</Label>
                    <Select value={editRoleId} onValueChange={setEditRoleId} required>
                      <SelectTrigger id="edit-role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isEditingUser}>
                    {isEditingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>A list of all users in your organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="pl-6">Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.map((u) => (
                      <TableRow key={u.user.id}>
                        <TableCell className="pl-6 font-medium">{u.user.name || "N/A"}</TableCell>
                        <TableCell className="text-muted-foreground">{u.user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {u.role.name.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.user.status === "ACTIVE" ? "secondary" : "outline"}>
                            {u.user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => {
                                setEditingUser(u)
                                setEditRoleId(u.role.id)
                              }}>
                                <UserCog className="mr-2 h-4 w-4" />
                                Edit Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {u.user.status === "ACTIVE" ? (
                                <DropdownMenuItem className="text-warning" onClick={() => handleUpdateUserStatus(u.user.id, "SUSPENDED")}>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUpdateUserStatus(u.user.id, "ACTIVE")}>
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                  Activate User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveUser(u.user.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Dialog open={isRoleOpen} onOpenChange={setIsRoleOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewRole}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Role
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>{editingRole ? "Edit Role" : "Create Custom Role"}</DialogTitle>
                  <DialogDescription>
                    Define a set of permissions for your team members.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveRole}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="role-name">Role Name</Label>
                      <Input id="role-name" value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="e.g. Finance Manager" required />
                    </div>
                    <div className="grid gap-2">
                      <Label>Permissions</Label>
                      <div className="grid grid-cols-2 gap-4 border rounded-md p-4 max-h-[300px] overflow-y-auto bg-muted/20">
                        {permissionsList.map((perm) => (
                          <div key={perm.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={perm.id} 
                              checked={selectedPerms.has(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                            <label
                              htmlFor={perm.id}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {perm.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsRoleOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSavingRole}>
                      {isSavingRole ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Role"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Organization Roles</CardTitle>
              <CardDescription>System and custom roles with their associated permissions.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="pl-6">Role Name</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="pl-6 font-medium">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          {role.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-md truncate">
                        {role.permissions?.length > 0 
                          ? role.permissions.map((p: any) => p.permission.name).join(", ")
                          : "No specific permissions"
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.isSystem ? "secondary" : "outline"}>
                          {role.isSystem ? "System" : "Custom"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {role.isSystem ? (
                          <div className="flex justify-end pr-2">
                            <Lock className="h-4 w-4 text-muted-foreground opacity-50" />
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Settings2 className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditRole(role)}>
                                Edit Role
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteRole(role.id)}>
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
