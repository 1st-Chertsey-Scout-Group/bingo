import type { Server, Socket } from 'socket.io'
import { requireScoutContext, SOCKET_ROOMS } from '@/lib/socket-helpers'
import { prisma } from '@/lib/prisma'

type StoredPosition = {
  teamName: string
  teamColour: string
  lat: number
  lng: number
  accuracy: number
  updatedAt: number
}

// gameId -> teamId -> position
const locationStore = new Map<string, Map<string, StoredPosition>>()

const BROADCAST_INTERVAL_MS = 10_000
const STALE_THRESHOLD_MS = 60_000

export function clearGameLocations(gameId: string): void {
  locationStore.delete(gameId)
}

export function startLocationBroadcast(io: Server): void {
  setInterval(() => {
    const now = Date.now()

    for (const [gameId, teams] of locationStore) {
      if (teams.size === 0) {
        locationStore.delete(gameId)
        continue
      }

      const positions = []

      for (const [teamId, pos] of teams) {
        if (now - pos.updatedAt > STALE_THRESHOLD_MS) continue
        positions.push({
          teamId,
          teamName: pos.teamName,
          teamColour: pos.teamColour,
          lat: pos.lat,
          lng: pos.lng,
          accuracy: pos.accuracy,
          updatedAt: pos.updatedAt,
        })
      }

      if (positions.length > 0) {
        io.to(SOCKET_ROOMS.leaders(gameId)).emit('location:positions', {
          positions,
        })
      }
    }
  }, BROADCAST_INTERVAL_MS)
}

export function registerLocationHandlers(_io: Server, socket: Socket): void {
  socket.on(
    'location:update',
    async (
      payload: { lat: number; lng: number; accuracy: number } | undefined,
    ) => {
      if (!payload) return

      const { lat, lng, accuracy } = payload

      if (
        typeof lat !== 'number' ||
        typeof lng !== 'number' ||
        typeof accuracy !== 'number'
      ) {
        return
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || accuracy < 0) {
        return
      }

      const ctx = requireScoutContext(socket)
      if (!ctx) return
      const { gameId, teamId } = ctx

      let gameTeams = locationStore.get(gameId)
      if (!gameTeams) {
        gameTeams = new Map()
        locationStore.set(gameId, gameTeams)
      }

      const existing = gameTeams.get(teamId)
      if (existing) {
        existing.lat = lat
        existing.lng = lng
        existing.accuracy = accuracy
        existing.updatedAt = Date.now()
      } else {
        // Look up team name and colour
        const team = await prisma.team.findUnique({
          where: { id: teamId },
          select: { name: true, colour: true },
        })
        if (!team) return

        gameTeams.set(teamId, {
          teamName: team.name,
          teamColour: team.colour,
          lat,
          lng,
          accuracy,
          updatedAt: Date.now(),
        })
      }
    },
  )
}
