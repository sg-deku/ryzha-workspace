"use client"

import { useState } from "react"
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
  ShieldCheck,
  UserCog,
  Loader2,
  Shield,
  Settings2,
  Lock
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

const MOCK_USERS = [
  { id: "1", name: "John Doe", email: "john@startup.com", role: "ADMIN", status: "Active" },
  { id: "2", name: "Jane Smith", email: "jane@startup.com", role: "MEMBER", status: "Active" },
  { id: "3", name: "Invited User", email: "invited@startup.com", role: "VIEWER", status: "Invited" },
]

const MOCK_ROLES = [
  { id: "1", name: "Admin", permissions: "Full access (default)", type: "System" },
  { id: "2", name: "Member", permissions: "Create/read own invoices/exp", type: "System" },
  { id: "3", name: "Viewer", permissions: "Read-only access", type: "System" },
  { id: "4", name: "Auditor", permissions: "Read + audit logs access", type: "System" },
  { id: "5", name: "Finance Manager", permissions: "invoices:crud, expenses:crud", type: "Custom" },
]

const PERMISSIONS = [
  { id: "invoices:create", label: "invoices:create" },
  { id: "invoices:read", label: "invoices:read" },
  { id: "invoices:update", label: "invoices:update" },
  { id: "invoices:delete", label: "invoices:delete" },
  { id: "expenses:create", label: "expenses:create" },
  { id: "expenses:read", label: "expenses:read" },
  { id: "expenses:delete", label: "expenses:delete" },
  { id: "reports:view", label: "reports:view" },
  { id: "users:manage", label: "users:manage" },
  { id: "roles:manage", label: "roles:manage" },
  { id: "agent:view_logs", label: "agent:view_logs" },
]

export default function UsersManagementPage() {
  const [search, setSearch] = useState("")
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [isNewRoleOpen, setIsNewRoleOpen] = useState(false)
  const [isCreatingRole, setIsCreatingRole] = useState(false)

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)
    setTimeout(() => {
      toast.success("Invitation sent successfully")
      setIsInviting(false)
      setIsInviteOpen(false)
    }, 1500)
  }

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingRole(true)
    setTimeout(() => {
      toast.success("Custom role created successfully")
      setIsCreatingRole(false)
      setIsNewRoleOpen(false)
    }, 1500)
  }

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
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="colleague@example.com" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select defaultValue="MEMBER">
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="VIEWER">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isInviting}>
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
                    {MOCK_USERS.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="pl-6 font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "Active" ? "secondary" : "outline"}>
                            {user.status}
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
                              <DropdownMenuItem>
                                <UserCog className="mr-2 h-4 w-4" />
                                Edit Role
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" />
                                Resend Invite
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                Suspend User
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Delete
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
            <Dialog open={isNewRoleOpen} onOpenChange={setIsNewRoleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Role
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create Custom Role</DialogTitle>
                  <DialogDescription>
                    Define a new set of permissions for your team members.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateRole}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="role-name">Role Name</Label>
                      <Input id="role-name" placeholder="e.g. Finance Manager" required />
                    </div>
                    <div className="grid gap-2">
                      <Label>Permissions</Label>
                      <div className="grid grid-cols-2 gap-4 border rounded-md p-4 max-h-[300px] overflow-y-auto bg-muted/20">
                        {PERMISSIONS.map((perm) => (
                          <div key={perm.id} className="flex items-center space-x-2">
                            <Checkbox id={perm.id} />
                            <label
                              htmlFor={perm.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {perm.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsNewRoleOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreatingRole}>
                      {isCreatingRole ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Role"
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
                  {MOCK_ROLES.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="pl-6 font-medium">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          {role.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-md truncate">
                        {role.permissions}
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.type === "System" ? "secondary" : "outline"}>
                          {role.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {role.type === "System" ? (
                          <div className="flex justify-end pr-2">
                            <Lock className="h-4 w-4 text-muted-foreground opacity-50" />
                          </div>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Settings2 className="h-4 w-4" />
                          </Button>
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
