'use client'

import { useState, type FormEvent } from 'react'
import { Lock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AdminPage() {
  const [adminPin, setAdminPin] = useState<string | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleAuthenticate(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/items', {
        headers: { 'X-Admin-Pin': pinInput },
      })

      if (response.ok) {
        setAdminPin(pinInput)
        setPinInput('')
      } else if (response.status === 401) {
        setError('Invalid admin PIN')
      } else {
        setError('Authentication failed')
      }
    } catch {
      setError('Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (!adminPin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-5" />
              Admin Access
            </CardTitle>
            <CardDescription>
              Enter the admin PIN to manage games and items.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthenticate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="admin-pin">Admin PIN</Label>
                <Input
                  id="admin-pin"
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter admin PIN"
                  required
                />
              </div>
              {error && (
                <p className="text-destructive text-sm font-medium">{error}</p>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Authenticating…' : 'Authenticate'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex items-center gap-2">
          <Shield className="size-6" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Game Creation</CardTitle>
            <CardDescription>
              Create and manage bingo games. Coming in step 061.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Game creation controls will appear here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Item Management</CardTitle>
            <CardDescription>
              Manage bingo board items. Coming in step 064.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Item management controls will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminPage
