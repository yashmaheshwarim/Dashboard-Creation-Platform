"use client"

import { useState } from "react"
import { User, Database, Shield, Palette, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    profile: {
      name: "John Doe",
      email: "john@example.com",
      company: "DataInsight Pro",
    },
    preferences: {
      theme: "light",
      language: "en",
      timezone: "UTC",
      autoSave: true,
      notifications: true,
    },
    data: {
      retentionDays: 90,
      autoCleanup: true,
      exportFormat: "json",
      maxFileSize: 100,
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      dataEncryption: true,
    },
  })

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value,
      },
    }))
  }

  const saveSettings = () => {
    // In a real app, this would save to a backend
    console.log("Settings saved:", settings)
    alert("Settings saved successfully!")
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "dashboard-settings.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export Settings
          </Button>
          <Button size="sm" onClick={saveSettings}>
            Save Changes
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>Update your personal information and account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={settings.profile.name}
                      onChange={(e) => updateSetting("profile", "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => updateSetting("profile", "email", e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="company">Company/Organization</Label>
                    <Input
                      id="company"
                      value={settings.profile.company}
                      onChange={(e) => updateSetting("profile", "company", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Application Preferences
                </CardTitle>
                <CardDescription>Customize your dashboard experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={settings.preferences.theme}
                      onValueChange={(value) => updateSetting("preferences", "theme", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={settings.preferences.language}
                      onValueChange={(value) => updateSetting("preferences", "language", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={settings.preferences.timezone}
                      onValueChange={(value) => updateSetting("preferences", "timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="EST">Eastern Time</SelectItem>
                        <SelectItem value="PST">Pacific Time</SelectItem>
                        <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-save">Auto-save dashboards</Label>
                      <p className="text-sm text-muted-foreground">Automatically save dashboard changes</p>
                    </div>
                    <Switch
                      id="auto-save"
                      checked={settings.preferences.autoSave}
                      onCheckedChange={(checked) => updateSetting("preferences", "autoSave", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications">Enable notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts about data processing and updates</p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={settings.preferences.notifications}
                      onCheckedChange={(checked) => updateSetting("preferences", "notifications", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>Configure how your data is stored and processed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="retention">Data Retention (days)</Label>
                    <Input
                      id="retention"
                      type="number"
                      value={settings.data.retentionDays}
                      onChange={(e) => updateSetting("data", "retentionDays", Number.parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">How long to keep processed data</p>
                  </div>
                  <div>
                    <Label htmlFor="file-size">Max File Size (MB)</Label>
                    <Input
                      id="file-size"
                      type="number"
                      value={settings.data.maxFileSize}
                      onChange={(e) => updateSetting("data", "maxFileSize", Number.parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">Maximum upload file size</p>
                  </div>
                  <div>
                    <Label htmlFor="export-format">Default Export Format</Label>
                    <Select
                      value={settings.data.exportFormat}
                      onValueChange={(value) => updateSetting("data", "exportFormat", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="xlsx">Excel</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-cleanup">Auto-cleanup old data</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically remove data older than retention period
                    </p>
                  </div>
                  <Switch
                    id="auto-cleanup"
                    checked={settings.data.autoCleanup}
                    onCheckedChange={(checked) => updateSetting("data", "autoCleanup", checked)}
                  />
                </div>

                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    Data retention settings help manage storage space and comply with data governance policies.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage your account security and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting("security", "sessionTimeout", Number.parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">Auto-logout after inactivity</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Switch
                      id="two-factor"
                      checked={settings.security.twoFactor}
                      onCheckedChange={(checked) => updateSetting("security", "twoFactor", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="data-encryption">Data Encryption</Label>
                      <p className="text-sm text-muted-foreground">Encrypt sensitive data at rest and in transit</p>
                    </div>
                    <Switch
                      id="data-encryption"
                      checked={settings.security.dataEncryption}
                      onCheckedChange={(checked) => updateSetting("security", "dataEncryption", checked)}
                    />
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Enable two-factor authentication and data encryption for maximum security.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
