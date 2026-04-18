import type { Socket } from 'socket.io'

export function requireString(
  socket: Socket,
  value: unknown,
  fieldName: string,
): value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    socket.emit('error', { message: `${fieldName} is required` })
    return false
  }
  return true
}

export type SocketContext = {
  gameId: string
  teamId?: string
  leaderName?: string
  role: string
}

export function getSocketContext(socket: Socket): SocketContext | null {
  const gameId =
    typeof socket.data.gameId === 'string' ? socket.data.gameId : undefined
  if (!gameId) return null

  return {
    gameId,
    teamId:
      typeof socket.data.teamId === 'string' ? socket.data.teamId : undefined,
    leaderName:
      typeof socket.data.leaderName === 'string'
        ? socket.data.leaderName
        : undefined,
    role: typeof socket.data.role === 'string' ? socket.data.role : '',
  }
}

export function requireLeaderContext(
  socket: Socket,
): { gameId: string; leaderName: string } | null {
  const gameId =
    typeof socket.data.gameId === 'string' ? socket.data.gameId : undefined
  const leaderName =
    typeof socket.data.leaderName === 'string'
      ? socket.data.leaderName
      : undefined

  if (!gameId || !leaderName) {
    socket.emit('error', { message: 'Not connected as a leader' })
    return null
  }

  return { gameId, leaderName }
}

export function requireScoutContext(
  socket: Socket,
): { gameId: string; teamId: string } | null {
  const gameId =
    typeof socket.data.gameId === 'string' ? socket.data.gameId : undefined
  const teamId =
    typeof socket.data.teamId === 'string' ? socket.data.teamId : undefined

  if (!gameId || !teamId) {
    socket.emit('error', { message: 'Not connected to a game' })
    return null
  }

  return { gameId, teamId }
}

export const SOCKET_ROOMS = {
  game: (gameId: string) => `game:${gameId}`,
  team: (teamId: string) => `team:${teamId}`,
  leaders: (gameId: string) => `leaders:${gameId}`,
} as const

export const ROOM_PREFIXES = {
  GAME: 'game:',
  TEAM: 'team:',
  LEADERS: 'leaders:',
} as const

export async function isLeaderNameTaken(
  io: {
    in(room: string): {
      fetchSockets(): Promise<{ id: string; data: Record<string, unknown> }[]>
    }
  },
  gameId: string,
  leaderName: string,
  excludeSocketId?: string,
): Promise<boolean> {
  const connectedLeaders = await io
    .in(SOCKET_ROOMS.leaders(gameId))
    .fetchSockets()
  return connectedLeaders.some(
    (remote) =>
      remote.id !== excludeSocketId &&
      typeof remote.data.leaderName === 'string' &&
      remote.data.leaderName.toLowerCase() === leaderName.toLowerCase(),
  )
}
