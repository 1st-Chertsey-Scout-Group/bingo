'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type ValidateResponse =
  | { valid: false }
  | { valid: true; role: 'scout' | 'leader'; gameId: string }

type Phase = 'pin' | 'leader-name'

export default function LandingPage() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<Phase>('pin')
  const [validatedPin, setValidatedPin] = useState('')
  const [gameId, setGameId] = useState('')
  const [leaderName, setLeaderName] = useState('')
  const [nameError, setNameError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handlePinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, '')
    setPin(value)
    if (error) setError('')
  }

  function handleBackToPin() {
    setPhase('pin')
    setValidatedPin('')
    setGameId('')
    setPin('')
    setError('')
    setLeaderName('')
    setNameError('')
  }

  function handleLeaderNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLeaderName(e.target.value)
    if (nameError) setNameError('')
  }

  function handleLeaderJoin(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = leaderName.trim()
    if (!trimmed) {
      setNameError('Please enter your name')
      return
    }

    try {
      localStorage.setItem(
        'scout-bingo-session',
        JSON.stringify({
          gamePin: validatedPin,
          leaderPin: validatedPin,
          gameId,
          leaderName: trimmed,
          role: 'leader',
        }),
      )
    } catch {
      // If localStorage write fails, still attempt the redirect
    }

    router.push(`/leader/${gameId}`)
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
        setValidatedPin(pin)
        setGameId(data.gameId)
        setPhase('leader-name')
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
          <p className="text-muted-foreground">
            {phase === 'pin'
              ? 'Enter your game PIN to join'
              : 'Enter your name to continue as leader'}
          </p>
        </CardHeader>
        <CardContent>
          {phase === 'pin' ? (
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
          ) : (
            <form onSubmit={handleLeaderJoin} className="flex flex-col gap-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackToPin}
                className="self-start"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <h2 className="text-foreground text-center text-xl font-semibold">
                Welcome, Leader
              </h2>
              <Input
                type="text"
                value={leaderName}
                onChange={handleLeaderNameChange}
                placeholder="Your name"
                autoFocus
                className="h-14 text-center text-lg"
                aria-label="Leader display name"
              />
              <Button
                type="submit"
                disabled={leaderName.trim().length === 0}
                className="h-12 w-full text-lg font-semibold"
              >
                Join as Leader
              </Button>
              {nameError && (
                <p className="text-destructive text-center text-sm font-medium">
                  {nameError}
                </p>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
