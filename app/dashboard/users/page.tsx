"use client"

import { useState } from "react"
import { Users, UserPlus, Mail, MoreHorizontal, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "editor" | "viewer"
  status: "active" | "inactive" | "pending"
  lastActive: string
  avatar?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
      status: "active",
      lastActive: "2024-01-15T10:30:00Z",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "editor",
      status: "active",
      lastActive: "2024-01-14T15:45:00Z",
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "viewer",
      status: "inactive",
      lastActive: "2024-01-10T09:15:00Z",
    },
    {
      id: "4",
      name: "Alice Brown",
      email: "alice@example.com",
      role: "editor",
      status: "pending",
      lastActive: "2024-01-15T12:00:00Z",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "viewer" as User["role"],
  })

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return <Badge variant="default">Admin</Badge>
      case "editor":
        return <Badge variant="secondary">Editor</Badge>
      case "viewer":
        return <Badge variant="outline">Viewer</Badge>
    }
  }

  const getStatusBadge = (status: User["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
  }

  const addUser = () => {
    if (newUser.name && newUser.email) {
      const user: User = {
        id: Date.now().toString(),
        ...newUser,
        status: "pending",
        lastActive: new Date().toISOString(),
      }
      setUsers((prev) => [...prev, user])
      setNewUser({ name: "", email: "", role: "viewer" })
      setIsAddUserOpen(false)
    }
  }

  const updateUserRole = (userId: string, newRole: User["role"]) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user)))
  }

  const updateUserStatus = (userId: string, newStatus: User["status"]) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, status: newStatus } : user)))
  }

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== userId))
  }

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">User Management</h1>
          <Badge variant="outline">{users.length} users</Badge>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Invite a new user to your dashboard. They will receive an email invitation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-name">Full Name</Label>
                  <Input
                    id="user-name"
                    value={newUser.name}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="user-email">Email Address</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="user-role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser((prev) => ({ ...prev, role: value as User["role"] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addUser}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>Manage user access and permissions for your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback>
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Last active: {formatLastActive(user.lastActive)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateUserRole(user.id, "admin")}>Make Admin</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserRole(user.id, "editor")}>
                          Make Editor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserRole(user.id, "viewer")}>
                          Make Viewer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateUserStatus(user.id, "active")}>
                          Activate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateUserStatus(user.id, "inactive")}>
                          Deactivate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => deleteUser(user.id)} className="text-red-600">
                          Remove User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
