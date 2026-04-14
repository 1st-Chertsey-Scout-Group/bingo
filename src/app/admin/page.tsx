'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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

type GameResponse = {
  gameId: string
  pin: string
  leaderPin: string
  status: string
  boardSize: number
  templateCount: number
}

type GameCreationFormProps = {
  adminPin: string
}

function GameCreationForm({ adminPin }: GameCreationFormProps) {
  const router = useRouter()
  const [leaderPin, setLeaderPin] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [boardSize, setBoardSize] = useState(25)
  const [templateCount, setTemplateCount] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdGame, setCreatedGame] = useState<GameResponse | null>(null)
  const [formError, setFormError] = useState('')

  const templateCountMax = Math.min(10, boardSize)

  useEffect(() => {
    if (templateCount > templateCountMax) {
      setTemplateCount(templateCountMax)
    }
  }, [templateCount, templateCountMax])

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
        body: JSON.stringify({ leaderPin, boardSize, templateCount }),
      })

      if (response.status === 201) {
        const data = (await response.json()) as GameResponse
        setCreatedGame(data)
        toast.success(`Game created! PIN: ${data.pin}`)

        try {
          localStorage.setItem(
            'scout-bingo-session',
            JSON.stringify({
              gamePin: data.pin,
              leaderPin,
              gameId: data.gameId,
              leaderName: displayName,
              role: 'leader',
            }),
          )
        } catch {
          // localStorage may be unavailable in private browsing
        }

        setTimeout(() => {
          router.push(`/leader/${data.gameId}`)
        }, 500)
      } else {
        const errorData = (await response.json()) as { error: string }
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
            <Label htmlFor="leader-pin">Leader PIN</Label>
            <Input
              id="leader-pin"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={leaderPin}
              onChange={(e) => setLeaderPin(e.target.value)}
              placeholder="4-digit PIN"
              required
              className="h-12 text-lg"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="display-name">Display Name</Label>
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="board-size">
              Board Size: <span className="font-bold">{boardSize}</span>
            </Label>
            <input
              id="board-size"
              type="range"
              min={9}
              max={25}
              value={boardSize}
              onChange={(e) => setBoardSize(Number(e.target.value))}
              className="h-10 w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="template-count">
              Template Count: <span className="font-bold">{templateCount}</span>
            </Label>
            <input
              id="template-count"
              type="range"
              min={0}
              max={templateCountMax}
              value={templateCount}
              onChange={(e) => setTemplateCount(Number(e.target.value))}
              className="h-10 w-full"
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
                PIN: {createdGame.pin}
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

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

        <GameCreationForm adminPin={adminPin} />

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
