'use client'

import { useState, useEffect } from 'react'
import type { Team } from '@/types'
import { Button } from '@/components/ui/button'
import { TeamBadge } from '@/components/TeamBadge'

type LobbyProps = {
  myTeam: { name: string; colour: string } | null
  teams: Team[]
  role: 'scout' | 'leader'
  gamePin?: string
  leaderPin?: string
  onStartRound?: () => void
}

export function Lobby({
  myTeam,
  teams,
  role,
  gamePin,
  leaderPin,
  onStartRound,
}: LobbyProps) {
  const [isLandscape, setIsLandscape] = useState(false)
  const [host, setHost] = useState('')

  useEffect(() => {
    const mql = window.matchMedia('(orientation: landscape)')
    setIsLandscape(mql.matches)
    setHost(window.location.host)

    const handler = (e: MediaQueryListEvent) => {
      setIsLandscape(e.matches)
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  if (isLandscape && role === 'leader') {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
        onClick={() => setIsLandscape(false)}
      >
        <p className="text-4xl font-bold">{host}</p>
        <p className="font-mono text-[20vw] leading-none font-bold">
          {gamePin}
        </p>
        <p className="text-muted-foreground text-sm">
          Rotate to portrait to return
        </p>
      </div>
    )
  }

  if (role === 'scout') {
    return (
      <div className="flex flex-col items-center gap-6 p-4">
        {myTeam && (
          <div
            className="w-full rounded-xl p-6 text-center text-white"
            style={{ backgroundColor: myTeam.colour }}
          >
            <p className="text-sm">You are:</p>
            <p className="text-3xl font-bold">{myTeam.name}</p>
          </div>
        )}

        <p className="text-muted-foreground">
          Waiting for the leader to start...
        </p>

        <div className="flex flex-wrap gap-2">
          {teams.map((team) => (
            <TeamBadge key={team.id} name={team.name} colour={team.colour} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="flex justify-center gap-4">
        <div className="bg-muted rounded-xl p-4 text-center">
          <p className="text-muted-foreground text-sm">Scout PIN</p>
          <p className="font-mono text-4xl font-bold">{gamePin}</p>
        </div>
        <div className="bg-muted rounded-xl p-4 text-center">
          <p className="text-muted-foreground text-sm">Leader PIN</p>
          <p className="font-mono text-4xl font-bold">{leaderPin}</p>
        </div>
      </div>

      <div className="w-full">
        <h2 className="mb-2 text-lg font-semibold">
          Teams Joined ({teams.length})
        </h2>
        {teams.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {teams.map((team) => (
              <TeamBadge key={team.id} name={team.name} colour={team.colour} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Waiting for scouts to join...</p>
        )}
      </div>

      <Button
        size="lg"
        className="mt-6 h-14 w-full text-lg"
        disabled={teams.length < 2}
        onClick={onStartRound}
      >
        Start Round
      </Button>
      {teams.length < 2 && (
        <p className="text-muted-foreground text-sm">
          Need at least 2 teams to start
        </p>
      )}
    </div>
  )
}
