'use client'

import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function LandingPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handlePinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, '')
    setPin(value)
    if (error) setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length < 4) return
    // TODO: navigate to game with PIN
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
              autoFocus
              className="h-14 text-center text-3xl font-bold tracking-[0.5em]"
              aria-label="Game PIN"
            />
            <Button
              type="submit"
              disabled={pin.length < 4}
              className="h-12 w-full text-lg font-semibold"
            >
              Join
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
