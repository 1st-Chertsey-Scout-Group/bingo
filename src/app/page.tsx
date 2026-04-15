'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type ValidateResponse =
  | { valid: false }
  | { valid: true; role: 'scout' | 'leader'; gameId: string }

export default function LandingPage() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [leaderData, setLeaderData] = useState<{
    gameId: string
    pin: string
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handlePinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, '')
    setPin(value)
    if (error) setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length < 4) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })

      const data: ValidateResponse = await res.json()

      if (!data.valid) {
        setError('Invalid PIN')
        setPin('')
        return
      }

      if (data.role === 'scout') {
        localStorage.setItem(
          'scout-bingo-session',
          JSON.stringify({
            gamePin: pin,
            gameId: data.gameId,
            role: 'scout',
          }),
        )
        router.push(`/play/${data.gameId}`)
        return
      }

      if (data.role === 'leader') {
        setLeaderData({ gameId: data.gameId, pin })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center">
          <h1 className="text-foreground text-4xl font-bold tracking-tight">
            Scout Bingo
          </h1>
          <p className="text-muted-foreground">Enter your game PIN to join</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={handlePinChange}
              placeholder="0000"
              disabled={loading}
              autoFocus
              className="h-14 text-center text-3xl font-bold tracking-[0.5em]"
              aria-label="Game PIN"
            />
            <Button
              type="submit"
              disabled={pin.length < 4 || loading}
              className="h-12 w-full text-lg font-semibold"
            >
              {loading ? 'Joining...' : 'Join'}
            </Button>
            {error && (
              <p className="text-destructive text-center text-sm font-medium">
                {error}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
