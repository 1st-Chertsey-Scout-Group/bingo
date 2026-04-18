import type { Server, Socket } from 'socket.io'
import { GAME_STATUS, SUBMISSION_STATUS } from '@/lib/constants'
import { prisma } from '@/lib/prisma'
import {
  isLeaderNameTaken,
  requireLeaderContext,
  requireScoutContext,
  requireString,
  ROOM_PREFIXES,
  SOCKET_ROOMS,
} from '@/lib/socket-helpers'
import {
  cancelLockTimeout,
  cancelTeamDeleteTimeout,
} from '@/server/socket-handler'
import { withGameMutex } from '@/lib/game-mutex'
import {
  generateSessionToken,
  hashSessionToken,
  verifySessionToken,
} from '@/lib/session-token'
import { getAllTeamsInGame, getTeamsInGame } from '@/lib/repositories/team'
import { pickRandomUnusedTeam, TEAMS } from '@/lib/teams'

async function leaveGameRooms(socket: Socket): Promise<void> {
  for (const room of Array.from(socket.rooms)) {
    if (
      room.startsWith(ROOM_PREFIXES.GAME) ||
      room.startsWith(ROOM_PREFIXES.TEAM) ||
      room.startsWith(ROOM_PREFIXES.LEADERS)
    ) {
      await socket.leave(room)
    }
  }
}

async function buildRejoinBoard(gameId: string) {
  const [allTeams, roundItems, claimTeams] = await Promise.all([
    getTeamsInGame(gameId),
    prisma.roundItem.findMany({
      where: { gameId },
      include: {
        submissions: {
          where: { status: SUBMISSION_STATUS.PENDING },
          select: { id: true },
        },
      },
    }),
    getAllTeamsInGame(gameId),
  ])

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

  return { allTeams, board }
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
      if (!requireString(socket, gamePin, 'gamePin')) return

      const game = await prisma.game.findFirst({
        where: {
          pin: gamePin,
          status: { not: GAME_STATUS.ENDED },
        },
      })

      if (!game) {
        socket.emit('error', { message: 'Game not found' })
        return
      }

      if (game.status !== GAME_STATUS.LOBBY) {
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

        if (await isLeaderNameTaken(io, game.id, leaderName)) {
          socket.emit('error', {
            message: 'That leader name is already in use',
          })
          return
        }

        await leaveGameRooms(socket)
        await socket.join(SOCKET_ROOMS.game(game.id))
        await socket.join(SOCKET_ROOMS.leaders(game.id))

        socket.data.gameId = game.id
        socket.data.leaderName = leaderName
        socket.data.role = 'leader'

        socket.emit('lobby:joined', {
          gameId: game.id,
          leaderName,
        })

        const allTeams = await getTeamsInGame(game.id)

        socket.emit('lobby:teams', { teams: allTeams })
        return
      }

      // Idempotency: if this socket already has a live team, don't create another
      if (socket.data.teamId) {
        const existingTeam = await prisma.team.findUnique({
          where: { id: socket.data.teamId },
        })
        if (existingTeam) return
        // Team was deleted (new round) — clear stale socket data
        socket.data.teamId = undefined
      }

      const sessionToken = generateSessionToken()
      const sessionTokenHash = hashSessionToken(sessionToken)

      const assigned = await withGameMutex(game.id, async () => {
        const existing = await prisma.team.findMany({
          where: { gameId: game.id },
          select: { name: true },
        })

        const nextTeam = pickRandomUnusedTeam(existing.map((t) => t.name))
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
      await socket.join(SOCKET_ROOMS.game(game.id))
      await socket.join(SOCKET_ROOMS.team(team.id))

      socket.data.gameId = game.id
      socket.data.teamId = team.id
      socket.data.role = 'scout'

      socket.emit('lobby:joined', {
        teamId: team.id,
        teamName: team.name,
        teamColour: team.colour,
        sessionToken,
        teamsLocked: game.teamsLocked,
      })

      const allTeams = await getTeamsInGame(game.id)

      io.to(SOCKET_ROOMS.game(game.id)).emit('lobby:teams', { teams: allTeams })
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

      if (game.status === GAME_STATUS.ENDED) {
        socket.emit('rejoin:error', { message: 'Game has ended' })
        return
      }

      const isLeader = 'leaderPin' in (payload ?? {})

      if (!isLeader) {
        // Scout rejoin
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

        if (team.gameId !== game.id) {
          socket.emit('rejoin:error', {
            message: 'Team not in this game',
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

        // Cancel any pending lobby-disconnect deletion for this team
        cancelTeamDeleteTimeout(teamId)

        // Update socket ID
        await prisma.team.update({
          where: { id: teamId },
          data: { socketId: socket.id },
        })

        // Join rooms
        await leaveGameRooms(socket)
        await socket.join(SOCKET_ROOMS.game(game.id))
        await socket.join(SOCKET_ROOMS.team(teamId))

        socket.data.gameId = game.id
        socket.data.teamId = teamId
        socket.data.role = 'scout'

        const { allTeams, board } = await buildRejoinBoard(game.id)

        const mySubmissions = await prisma.submission.findMany({
          where: { teamId, roundItem: { gameId: game.id } },
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
          previewBoard: null,
          teamsLocked: game.teamsLocked,
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

        if (await isLeaderNameTaken(io, game.id, leaderName, socket.id)) {
          socket.emit('rejoin:error', { message: 'Name already taken' })
          return
        }

        await leaveGameRooms(socket)
        await socket.join(SOCKET_ROOMS.game(game.id))
        await socket.join(SOCKET_ROOMS.leaders(game.id))

        socket.data.gameId = game.id
        socket.data.leaderName = leaderName
        socket.data.role = 'leader'

        // Cancel any pending lock timeout from a previous disconnect
        cancelLockTimeout(game.id, leaderName)

        const { allTeams, board } = await buildRejoinBoard(game.id)

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
          previewBoard: null,
          teamsLocked: game.teamsLocked,
        })
      }
    },
  )

  socket.on(
    'team:switch',
    async (payload: { targetTeamName: string } | undefined) => {
      const targetTeamName = payload?.targetTeamName
      if (!requireString(socket, targetTeamName, 'targetTeamName')) return

      const ctx = requireScoutContext(socket)
      if (!ctx) return
      const { gameId, teamId } = ctx

      const targetPreset = TEAMS.find((t) => t.name === targetTeamName)
      if (!targetPreset) {
        socket.emit('error', { message: 'Invalid team name' })
        return
      }

      const sessionToken = generateSessionToken()
      const sessionTokenHash = hashSessionToken(sessionToken)

      const result = await withGameMutex(gameId, async () => {
        const game = await prisma.game.findUnique({ where: { id: gameId } })
        if (!game || game.status !== GAME_STATUS.LOBBY) {
          return { kind: 'not_lobby' as const }
        }

        if (game.teamsLocked) {
          return { kind: 'locked' as const }
        }

        const existing = await prisma.team.findUnique({
          where: { gameId_name: { gameId, name: targetTeamName } },
        })
        if (existing) {
          return { kind: 'taken' as const }
        }

        await prisma.team.delete({ where: { id: teamId } })

        const created = await prisma.team.create({
          data: {
            gameId,
            name: targetPreset.name,
            colour: targetPreset.colour,
            socketId: socket.id,
            sessionTokenHash,
          },
        })

        return { kind: 'ok' as const, team: created }
      })

      if (result.kind === 'not_lobby') {
        socket.emit('error', { message: 'Game is not in lobby' })
        return
      }
      if (result.kind === 'locked') {
        socket.emit('error', { message: 'Team selection is locked' })
        return
      }
      if (result.kind === 'taken') {
        socket.emit('error', { message: 'That team is already taken' })
        return
      }

      const team = result.team

      // Update socket room
      await socket.leave(SOCKET_ROOMS.team(teamId))
      await socket.join(SOCKET_ROOMS.team(team.id))
      socket.data.teamId = team.id

      socket.emit('team:switched', {
        teamId: team.id,
        teamName: team.name,
        teamColour: team.colour,
        sessionToken,
      })

      const allTeams = await getTeamsInGame(gameId)
      io.to(SOCKET_ROOMS.game(gameId)).emit('lobby:teams', { teams: allTeams })
    },
  )

  socket.on('team:lock', async (payload: { locked: boolean } | undefined) => {
    if (typeof payload?.locked !== 'boolean') {
      socket.emit('error', { message: 'locked is required' })
      return
    }

    const ctx = requireLeaderContext(socket)
    if (!ctx) return
    const { gameId } = ctx

    const game = await prisma.game.findUnique({ where: { id: gameId } })
    if (!game || game.status !== GAME_STATUS.LOBBY) {
      socket.emit('error', { message: 'Game is not in lobby' })
      return
    }

    await prisma.game.update({
      where: { id: gameId },
      data: { teamsLocked: payload.locked },
    })

    io.to(SOCKET_ROOMS.game(gameId)).emit('team:locked', {
      locked: payload.locked,
    })
  })
}
