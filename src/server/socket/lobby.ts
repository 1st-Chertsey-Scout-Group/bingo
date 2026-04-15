import type { Server, Socket } from 'socket.io'
import { prisma } from '@/lib/prisma'
import { getNextTeam } from '@/lib/teams'

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
          socket.emit('error', { error: 'Invalid leader PIN' })
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
            error: 'That leader name is already in use',
          })
          return
        }

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

      const teamCount = await prisma.team.count({
        where: {
          gameId: game.id,
          round: game.round,
        },
      })

      const nextTeam = getNextTeam(teamCount)
      if (!nextTeam) {
        socket.emit('error', { message: 'No more teams available' })
        return
      }

      const team = await prisma.team.create({
        data: {
          gameId: game.id,
          name: nextTeam.name,
          colour: nextTeam.colour,
          socketId: socket.id,
          round: game.round,
        },
      })

      await socket.join(`game:${game.id}`)
      await socket.join(`team:${team.id}`)

      socket.emit('lobby:joined', {
        teamId: team.id,
        teamName: team.name,
        teamColour: team.colour,
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

  socket.on('rejoin', () => {
    // TODO: validate teamId, rejoin rooms, send full state
  })
}
