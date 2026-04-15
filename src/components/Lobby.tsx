'use client'

import type { Team } from '@/types'
import { TeamBadge } from '@/components/TeamBadge'

type LobbyProps = {
  myTeam: { name: string; colour: string } | null
  teams: Team[]
  role: 'scout' | 'leader'
}

export function Lobby({ myTeam, teams, role }: LobbyProps) {
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

  return null
}
