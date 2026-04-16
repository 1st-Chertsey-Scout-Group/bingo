import type { Server, Socket } from 'socket.io'
import { prisma } from '@/lib/prisma'
import { cancelLockTimeout } from '@/server/socket-handler'
import { withGameMutex } from '@/lib/game-mutex'
import {
  generateSessionToken,
  hashSessionToken,
  verifySessionToken,
} from '@/lib/session-token'
import { getNextTeam } from '@/lib/teams'

async function leaveGameRooms(socket: Socket): Promise<void> {
  for (const room of Array.from(socket.rooms)) {
    if (
      room.startsWith('game:') ||
      room.startsWith('team:') ||
      room.startsWith('leaders:')
    ) {
      await socket.leave(room)
    }
  }
}

export function registerLobbyHandlers(io: Server, socket: Socket): void {
  socket.on(
    'lobby:join',
    async (
      payload:
        | { gamePin: string; leaderPin?: string; leaderName?: string }
        | undefined,
    ) => {
      const gamePin = payload?.gamePin
      if (typeof gamePin !== 'string' || gamePin.trim() === '') {
        socket.emit('error', { message: 'gamePin is required' })
        return
      }

      const game = await prisma.game.findFirst({
        where: {
          pin: gamePin,
          status: { not: 'ended' },
        },
      })

      if (!game) {
        socket.emit('error', { message: 'Game not found' })
        return
      }

      if (game.status !== 'lobby') {
        socket.emit('error', { message: 'Game is not in lobby' })
        return
      }

      const isLeader = 'leaderPin' in (payload ?? {})

      if (isLeader) {
        const leaderPin = payload?.leaderPin
        if (typeof leaderPin !== 'string' || leaderPin !== game.leaderPin) {
          socket.emit('error', { message: 'Invalid leader PIN' })
          return
        }

        const leaderName =
          typeof payload?.leaderName === 'string'
            ? payload.leaderName.trim()
            : ''
        if (leaderName === '') {
          socket.emit('error', { message: 'leaderName is required' })
          return
        }

        const connectedLeaders = await io
          .in(`leaders:${game.id}`)
          .fetchSockets()
        const isDuplicate = connectedLeaders.some(
          (remote) =>
            typeof remote.data.leaderName === 'string' &&
            remote.data.leaderName.toLowerCase() === leaderName.toLowerCase(),
        )
        if (isDuplicate) {
          socket.emit('error', {
            message: 'That leader name is already in use',
          })
          return
        }

        await leaveGameRooms(socket)
        await socket.join(`game:${game.id}`)
        await socket.join(`leaders:${game.id}`)

        socket.data.gameId = game.id
        socket.data.leaderName = leaderName
        socket.data.role = 'leader'

        socket.emit('lobby:joined', {
          gameId: game.id,
          leaderName,
        })

        const allTeams = await prisma.team.findMany({
          where: {
            gameId: game.id,
            round: game.round,
          },
          select: {
            id: true,
            name: true,
            colour: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        })

        socket.emit('lobby:teams', { teams: allTeams })
        return
      }

      const sessionToken = generateSessionToken()
      const sessionTokenHash = hashSessionToken(sessionToken)

      const assigned = await withGameMutex(game.id, async () => {
        const teamCount = await prisma.team.count({
          where: {
            gameId: game.id,
            round: game.round,
          },
        })

        const nextTeam = getNextTeam(teamCount)
        if (!nextTeam) {
          return { kind: 'full' as const }
        }

        const created = await prisma.team.create({
          data: {
            gameId: game.id,
            name: nextTeam.name,
            colour: nextTeam.colour,
            socketId: socket.id,
            sessionTokenHash,
            round: game.round,
          },
        })
        return { kind: 'ok' as const, team: created }
      })

      if (assigned.kind === 'full') {
        socket.emit('error', { message: 'No more teams available' })
        return
      }

      const team = assigned.team

      await leaveGameRooms(socket)
      await socket.join(`game:${game.id}`)
      await socket.join(`team:${team.id}`)

      socket.data.gameId = game.id
      socket.data.teamId = team.id
      socket.data.role = 'scout'

      socket.emit('lobby:joined', {
        teamId: team.id,
        teamName: team.name,
        teamColour: team.colour,
        sessionToken,
      })

      const allTeams = await prisma.team.findMany({
        where: {
          gameId: game.id,
          round: game.round,
        },
        select: {
          id: true,
          name: true,
          colour: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

      io.to(`game:${game.id}`).emit('lobby:teams', { teams: allTeams })
    },
  )

  socket.on(
    'rejoin',
    async (
      payload:
        | {
            gamePin: string
            teamId?: string
            sessionToken?: string
            leaderPin?: string
            leaderName?: string
          }
        | undefined,
    ) => {
      const gamePin = payload?.gamePin
      if (typeof gamePin !== 'string' || gamePin.trim() === '') {
        socket.emit('rejoin:error', { message: 'gamePin is required' })
        return
      }

      const game = await prisma.game.findFirst({
        where: { pin: gamePin },
      })

      if (!game) {
        socket.emit('rejoin:error', { message: 'Game not found' })
        return
      }

      if (game.status === 'ended') {
        socket.emit('rejoin:error', { message: 'Game has ended' })
        return
      }

      const isLeader = 'leaderPin' in (payload ?? {})

      if (!isLeader) {
        // Scout rejoin
        if (game.status === 'lobby') {
          socket.emit('rejoin:error', {
            message: 'Round has ended — please rejoin',
          })
          return
        }

        const teamId = payload?.teamId
        if (typeof teamId !== 'string' || teamId.trim() === '') {
          socket.emit('rejoin:error', { message: 'teamId is required' })
          return
        }

        const sessionToken = payload?.sessionToken
        if (typeof sessionToken !== 'string' || sessionToken.trim() === '') {
          socket.emit('rejoin:error', { message: 'sessionToken is required' })
          return
        }

        const team = await prisma.team.findUnique({
          where: { id: teamId },
        })

        if (!team) {
          socket.emit('rejoin:error', { message: 'Team not found' })
          return
        }

        const roundMatches =
          team.round === game.round ||
          (game.status === 'active' && team.round === game.round - 1)
        if (team.gameId !== game.id || !roundMatches) {
          socket.emit('rejoin:error', {
            message: 'Team not in current round',
          })
          return
        }

        if (
          team.sessionTokenHash === null ||
          !verifySessionToken(sessionToken, team.sessionTokenHash)
        ) {
          socket.emit('rejoin:error', { message: 'Invalid session token' })
          return
        }

        // Update socket ID
        await prisma.team.update({
          where: { id: teamId },
          data: { socketId: socket.id },
        })

        // Join rooms
        await leaveGameRooms(socket)
        await socket.join(`game:${game.id}`)
        await socket.join(`team:${teamId}`)

        socket.data.gameId = game.id
        socket.data.teamId = teamId
        socket.data.role = 'scout'

        // Build full state
        const allTeams = await prisma.team.findMany({
          where: { gameId: game.id, round: game.round },
          select: { id: true, name: true, colour: true },
          orderBy: { createdAt: 'asc' },
        })

        const roundItems = await prisma.roundItem.findMany({
          where: { gameId: game.id, round: game.round },
          include: {
            submissions: {
              where: { status: 'pending' },
              select: { id: true },
            },
          },
        })

        const claimTeams = await prisma.team.findMany({
          where: { gameId: game.id },
          select: { id: true, name: true, colour: true },
        })

        const teamMap = new Map(claimTeams.map((t) => [t.id, t]))

        const board = roundItems.map((ri) => {
          const claimTeam = ri.claimedByTeamId
            ? teamMap.get(ri.claimedByTeamId)
            : null
          return {
            roundItemId: ri.id,
            displayName: ri.displayName,
            claimedByTeamId: ri.claimedByTeamId,
            claimedByTeamName: claimTeam?.name ?? null,
            claimedByTeamColour: claimTeam?.colour ?? null,
            hasPendingSubmissions: ri.submissions.length > 0,
            lockedByLeader: ri.lockedByLeader,
          }
        })

        const mySubmissions = await prisma.submission.findMany({
          where: { teamId, roundItem: { gameId: game.id, round: game.round } },
          select: { roundItemId: true, status: true },
        })

        const submissionMap: Array<[string, string]> = mySubmissions.map(
          (s) => [s.roundItemId, s.status],
        )

        socket.emit('rejoin:state', {
          status: game.status,
          teams: allTeams,
          board,
          myTeam: { id: team.id, name: team.name, colour: team.colour },
          mySubmissions: submissionMap,
          summary: null,
          roundStartedAt: game.roundStartedAt
            ? game.roundStartedAt.toISOString()
            : null,
          reviewingRoundItemId: null,
          currentSubmission: null,
        })
      } else {
        // Leader rejoin — implemented in step 137
        const leaderPin = payload?.leaderPin
        const leaderName = payload?.leaderName

        if (typeof leaderPin !== 'string' || leaderPin !== game.leaderPin) {
          socket.emit('rejoin:error', { message: 'Invalid leader PIN' })
          return
        }

        if (typeof leaderName !== 'string' || leaderName.trim() === '') {
          socket.emit('rejoin:error', { message: 'leaderName is required' })
          return
        }

        // Check leader name uniqueness
        const connectedLeaders = await io
          .in(`leaders:${game.id}`)
          .fetchSockets()
        const isDuplicate = connectedLeaders.some(
          (remote) =>
            typeof remote.data.leaderName === 'string' &&
            remote.data.leaderName.toLowerCase() === leaderName.toLowerCase(),
        )
        if (isDuplicate) {
          socket.emit('rejoin:error', { message: 'Name already taken' })
          return
        }

        await leaveGameRooms(socket)
        await socket.join(`game:${game.id}`)
        await socket.join(`leaders:${game.id}`)

        socket.data.gameId = game.id
        socket.data.leaderName = leaderName
        socket.data.role = 'leader'

        // Cancel any pending lock timeout from a previous disconnect
        cancelLockTimeout(game.id, leaderName)

        const allTeams = await prisma.team.findMany({
          where: { gameId: game.id, round: game.round },
          select: { id: true, name: true, colour: true },
          orderBy: { createdAt: 'asc' },
        })

        const roundItems = await prisma.roundItem.findMany({
          where: { gameId: game.id, round: game.round },
          include: {
            submissions: {
              where: { status: 'pending' },
              select: { id: true },
            },
          },
        })

        const claimTeams = await prisma.team.findMany({
          where: { gameId: game.id },
          select: { id: true, name: true, colour: true },
        })

        const teamMap = new Map(claimTeams.map((t) => [t.id, t]))

        const board = roundItems.map((ri) => {
          const claimTeam = ri.claimedByTeamId
            ? teamMap.get(ri.claimedByTeamId)
            : null
          return {
            roundItemId: ri.id,
            displayName: ri.displayName,
            claimedByTeamId: ri.claimedByTeamId,
            claimedByTeamName: claimTeam?.name ?? null,
            claimedByTeamColour: claimTeam?.colour ?? null,
            hasPendingSubmissions: ri.submissions.length > 0,
            lockedByLeader: ri.lockedByLeader,
          }
        })

        socket.emit('rejoin:state', {
          status: game.status,
          teams: allTeams,
          board,
          myTeam: null,
          mySubmissions: [],
          summary: null,
          roundStartedAt: game.roundStartedAt
            ? game.roundStartedAt.toISOString()
            : null,
          reviewingRoundItemId: null,
          currentSubmission: null,
        })
      }
    },
  )
}
