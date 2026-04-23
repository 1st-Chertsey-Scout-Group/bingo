'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Lock, Printer, Shield } from 'lucide-react'
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
import type { CreateGameResponse, ErrorResponse } from '@/lib/api-types'
import { saveSession } from '@/lib/session'

type GameCreationFormProps = {
  adminPin: string
}

const ADMIN_PIN_KEY = 'scout-bingo-admin-pin'
const LEADER_NAME_KEY = 'scout-bingo-leader-name'

function loadStored(key: string): string {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function storeValue(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // localStorage unavailable
  }
}

function GameCreationForm({ adminPin }: GameCreationFormProps) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setDisplayName(loadStored(LEADER_NAME_KEY))
  }, [])
  const [createdGame, setCreatedGame] = useState<CreateGameResponse | null>(
    null,
  )
  const [formError, setFormError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError('')

    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Pin': adminPin,
        },
        body: JSON.stringify({}),
      })

      if (response.status === 201) {
        const data = (await response.json()) as CreateGameResponse
        setCreatedGame(data)
        toast.success(
          `Game created! Scout: ${data.pin} / Leader: ${data.leaderPin}`,
        )

        storeValue(LEADER_NAME_KEY, displayName)
        saveSession({
          gamePin: data.pin,
          leaderPin: data.leaderPin,
          gameId: data.gameId,
          leaderName: displayName,
          role: 'leader',
        })

        setTimeout(() => {
          router.push(`/leader/${data.gameId}`)
        }, 500)
      } else {
        const errorData = (await response.json()) as ErrorResponse
        setFormError(errorData.error)
      }
    } catch {
      setFormError('Failed to create game. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Creation</CardTitle>
        <CardDescription>
          Create a new bingo game for your scout group.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="display-name">Your Name</Label>
            <Input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              required
              className="h-12 text-lg"
            />
          </div>

          {formError && (
            <p className="text-destructive text-sm font-medium">{formError}</p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 text-lg"
          >
            {isSubmitting ? 'Creating…' : 'Create Game'}
          </Button>

          {createdGame && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Game created!
              </p>
              <p className="mt-1 text-3xl font-bold text-green-900 dark:text-green-100">
                Scout PIN: {createdGame.pin}
              </p>
              <p className="mt-1 text-3xl font-bold text-green-900 dark:text-green-100">
                Leader PIN: {createdGame.leaderPin}
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

function AdminPage() {
  const [adminPin, setAdminPin] = useState('')
  const [pinInput, setPinInput] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [autoTrying, setAutoTrying] = useState(true)

  useEffect(() => {
    const stored = loadStored(ADMIN_PIN_KEY)
    if (!stored) {
      setAutoTrying(false)
      return
    }

    void (async () => {
      try {
        const response = await fetch('/api/items', {
          headers: { 'X-Admin-Pin': stored },
        })
        if (response.ok) {
          setAdminPin(stored)
        }
      } catch {
        // Failed — show manual form
      } finally {
        setAutoTrying(false)
      }
    })()
  }, [])

  async function handleAuthenticate(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/items', {
        headers: { 'X-Admin-Pin': pinInput },
      })

      if (response.ok) {
        storeValue(ADMIN_PIN_KEY, pinInput)
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

  if (autoTrying) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    )
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
              Enter the admin PIN to manage games.
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

        <GameCreationForm adminPin={adminPin} />

        <Link href="/admin/print-cards">
          <Button variant="outline" className="h-12 w-full text-lg">
            <Printer className="mr-2 size-5" />
            Print Paper Bingo Cards
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default AdminPage
