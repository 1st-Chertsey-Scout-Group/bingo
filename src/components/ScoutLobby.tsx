'use client'

import { Lock } from 'lucide-react'

import type { Team } from '@/types'
import { PRIMARY_TEAM_COUNT, TEAMS } from '@/lib/teams'

type ScoutLobbyProps = {
  myTeam: { name: string; colour: string } | null
  teams: Team[]
  teamsLocked?: boolean
  onSwitchTeam?: (teamName: string) => void
}

export function ScoutLobby({
  myTeam,
  teams,
  teamsLocked,
  onSwitchTeam,
}: ScoutLobbyProps) {
  const takenNames = new Set(teams.map((t) => t.name))
  const primaryFull = TEAMS.slice(0, PRIMARY_TEAM_COUNT).every((t) =>
    takenNames.has(t.name),
  )
  const visibleTeams = primaryFull ? TEAMS : TEAMS.slice(0, PRIMARY_TEAM_COUNT)

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {myTeam && (
        <div
          className="w-full rounded-2xl p-6 text-center text-white shadow-lg"
          style={{ backgroundColor: myTeam.colour }}
        >
          <p className="text-sm font-medium tracking-wider uppercase opacity-90">
            You are
          </p>
          <p className="animate-float text-3xl font-extrabold">{myTeam.name}</p>
        </div>
      )}

      <div className="bg-muted/60 w-full rounded-2xl border p-4">
        <h2 className="mb-2 text-center font-bold">How to Play</h2>
        <ol className="text-muted-foreground list-inside list-decimal space-y-1.5 text-sm">
          <li>Your leader will start the round with a bingo board</li>
          <li>Work as a team to find and photograph items on the board</li>
          <li>Tap a square, take a photo, and submit it</li>
          <li>
            A leader will review your photo — if approved, you claim that
            square!
          </li>
          <li>The team that claims the most squares wins</li>
        </ol>
      </div>

      <div className="relative w-full">
        <h2 className="mb-2 text-center font-semibold">Choose Your Team</h2>
        {!teamsLocked && (
          <p className="text-muted-foreground mb-3 text-center text-sm">
            Tap a team to switch
          </p>
        )}
        <div className="relative">
          <div className="grid grid-cols-2 gap-2">
            {visibleTeams.map((preset) => {
              const isMine = myTeam?.name === preset.name
              const isTaken = takenNames.has(preset.name) && !isMine
              const disabled = teamsLocked || isTaken || isMine

              return (
                <button
                  key={preset.name}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSwitchTeam?.(preset.name)}
                  className={`flex items-center gap-2 rounded-lg border p-2 text-left text-sm font-medium transition-colors ${
                    isMine
                      ? 'border-transparent text-white ring-2 ring-offset-1'
                      : isTaken
                        ? 'cursor-not-allowed opacity-30'
                        : 'hover:bg-muted active:bg-muted/80'
                  }`}
                  style={
                    isMine ? { backgroundColor: preset.colour } : undefined
                  }
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: preset.colour }}
                  />
                  {preset.name}
                </button>
              )
            })}
          </div>
          {teamsLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-black/40 bg-white/80">
              <Lock className="mb-2 h-12 w-12 text-black" />
              <p className="text-base font-bold text-black">
                Teams locked by leader
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="text-muted-foreground animate-pulse font-medium">
        Waiting for the leader to start...
      </p>
    </div>
  )
}
