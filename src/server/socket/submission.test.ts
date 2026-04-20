import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSocket, createMockIo, getHandler } from '@/test/mock-socket'
import { GAME_STATUS } from '@/lib/constants'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    game: { findUnique: vi.fn() },
    roundItem: { findUnique: vi.fn(), update: vi.fn() },
    team: { findUnique: vi.fn() },
    submission: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    pendingUpload: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/s3', () => ({
  getPhotoUrlPrefix: vi
    .fn()
    .mockReturnValue('https://s3.example.com/games/g-1/submissions/'),
}))

vi.mock('@/lib/services/lock-service', () => ({
  acquireLock: vi.fn().mockResolvedValue(undefined),
  releaseLock: vi.fn().mockResolvedValue(undefined),
  releaseLeaderLock: vi.fn().mockResolvedValue(null),
  UNLOCK_DATA: { lockedByLeader: null, lockedAt: null },
}))

vi.mock('@/lib/repositories/submission', () => ({
  getNextPendingSubmission: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/server/socket/game', () => ({
  endGame: vi.fn().mockResolvedValue(undefined),
}))

const { prisma } = (await import('@/lib/prisma')) as {
  prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>
}

import { registerSubmissionHandlers } from '@/server/socket/submission'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('registerSubmissionHandlers', () => {
  it('registers all handler events', () => {
    const socket = createMockSocket({
      gameId: 'g-1',
      teamId: 't-1',
      role: 'scout',
    })
    const io = createMockIo()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerSubmissionHandlers(io as any, socket as any)

    const events = socket.on.mock.calls.map((c: [string, unknown]) => c[0])
    expect(events).toContain('submission:submit')
    expect(events).toContain('review:open')
    expect(events).toContain('review:close')
    expect(events).toContain('review:approve')
    expect(events).toContain('review:reject')
  })

  describe('submission:submit', () => {
    it('emits error when not a scout', async () => {
      const socket = createMockSocket({
        gameId: 'g-1',
        teamId: 't-1',
        role: 'leader',
      })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      const handler = getHandler(socket, 'submission:submit')
      await handler({
        roundItemId: 'ri-1',
        photoUrl: 'https://s3.example.com/games/g-1/submissions/photo.webp',
      })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Only scouts can submit',
      })
    })

    it('emits error when game is not active', async () => {
      const socket = createMockSocket({
        gameId: 'g-1',
        teamId: 't-1',
        role: 'scout',
      })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ENDED,
      })

      const handler = getHandler(socket, 'submission:submit')
      await handler({
        roundItemId: 'ri-1',
        photoUrl: 'https://s3.example.com/games/g-1/submissions/photo.webp',
      })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Game is not active',
      })
    })

    it('emits error for invalid photoUrl prefix', async () => {
      const socket = createMockSocket({
        gameId: 'g-1',
        teamId: 't-1',
        role: 'scout',
      })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
      })
      prisma.roundItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        gameId: 'g-1',
      })
      prisma.team.findUnique.mockResolvedValue({
        id: 't-1',
        gameId: 'g-1',
        socketId: 'sock-1',
      })

      const handler = getHandler(socket, 'submission:submit')
      await handler({
        roundItemId: 'ri-1',
        photoUrl: 'https://evil.com/photo.webp',
      })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Invalid photo URL',
      })
    })

    it('emits error for missing roundItemId', async () => {
      const socket = createMockSocket({
        gameId: 'g-1',
        teamId: 't-1',
        role: 'scout',
      })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      const handler = getHandler(socket, 'submission:submit')
      await handler({ photoUrl: 'https://s3.example.com/photo.webp' })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'roundItemId is required',
      })
    })

    it('creates submission and emits events on success', async () => {
      const socket = createMockSocket({
        gameId: 'g-1',
        teamId: 't-1',
        role: 'scout',
      })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
      })
      prisma.roundItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        gameId: 'g-1',
      })
      prisma.team.findUnique.mockResolvedValue({
        id: 't-1',
        gameId: 'g-1',
        socketId: 'sock-1',
      })
      prisma.$transaction.mockResolvedValue({ kind: 'ok' })

      const handler = getHandler(socket, 'submission:submit')
      await handler({
        roundItemId: 'ri-1',
        photoUrl: 'https://s3.example.com/games/g-1/submissions/photo.webp',
      })

      expect(prisma.$transaction).toHaveBeenCalled()
      // On success, emits square:pending and submission:received
      expect(io.to).toHaveBeenCalled()
    })
  })

  describe('review:open', () => {
    it('emits error when not a leader', async () => {
      const socket = createMockSocket({}) // no leaderName
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      const handler = getHandler(socket, 'review:open')
      await handler({ roundItemId: 'ri-1' })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Not connected as a leader',
      })
    })

    it('emits error when no pending submissions', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
      })
      prisma.roundItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        gameId: 'g-1',
        claimedByTeamId: null,
        lockedByLeader: null,
      })
      prisma.submission.count.mockResolvedValue(0)

      const handler = getHandler(socket, 'review:open')
      await handler({ roundItemId: 'ri-1' })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'No pending submissions',
      })
    })
  })

  describe('review:open — happy path', () => {
    it('locks square and emits review:submission', async () => {
      const { getNextPendingSubmission } =
        await import('@/lib/repositories/submission')
      ;(
        getNextPendingSubmission as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: 's-1',
        roundItemId: 'ri-1',
        roundItem: { displayName: 'Oak Tree' },
        team: { name: 'Foxes', colour: '#ff0000' },
        photoUrl: 'https://example.com/photo.jpg',
      })

      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
      })
      prisma.roundItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        gameId: 'g-1',
        claimedByTeamId: null,
        lockedByLeader: null,
      })
      prisma.submission.count.mockResolvedValue(1)

      const handler = getHandler(socket, 'review:open')
      await handler({ roundItemId: 'ri-1' })

      const { acquireLock } = await import('@/lib/services/lock-service')
      expect(acquireLock).toHaveBeenCalledWith('ri-1', 'Alice')
      expect(socket.emit).toHaveBeenCalledWith(
        'review:submission',
        expect.objectContaining({ roundItemId: 'ri-1' }),
      )
    })

    it('emits error when square is already claimed', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
      })
      prisma.roundItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        gameId: 'g-1',
        claimedByTeamId: 't-1',
        lockedByLeader: null,
      })

      const handler = getHandler(socket, 'review:open')
      await handler({ roundItemId: 'ri-1' })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Square already claimed',
      })
    })

    it('emits error when locked by another leader', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
      })
      prisma.roundItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        gameId: 'g-1',
        claimedByTeamId: null,
        lockedByLeader: 'Bob',
      })

      const handler = getHandler(socket, 'review:open')
      await handler({ roundItemId: 'ri-1' })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Square is locked by Bob',
      })
    })
  })

  describe('review:close', () => {
    it('emits error when caller does not hold the lock', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.roundItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        lockedByLeader: 'Bob',
      })

      const handler = getHandler(socket, 'review:close')
      await handler({ roundItemId: 'ri-1' })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'You do not hold the lock',
      })
    })

    it('releases lock and broadcasts square:unlocked', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.roundItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        lockedByLeader: 'Alice',
      })

      const handler = getHandler(socket, 'review:close')
      await handler({ roundItemId: 'ri-1' })

      const { releaseLock } = await import('@/lib/services/lock-service')
      expect(releaseLock).toHaveBeenCalledWith('ri-1')
      expect(io.to).toHaveBeenCalledWith('leaders:g-1')
    })
  })

  describe('review:approve', () => {
    it('emits error when submissionId is missing', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      const handler = getHandler(socket, 'review:approve')
      await handler({})

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'submissionId is required',
      })
    })

    it('claims square on successful approval', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.$transaction.mockResolvedValue({
        approved: true,
        roundItemId: 'ri-1',
        teamId: 't-1',
        teamName: 'Foxes',
        teamColour: '#ff0000',
        discardedTeamIds: [],
      })
      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
      })
      prisma.roundItem.count = vi.fn().mockResolvedValue(1)

      const handler = getHandler(socket, 'review:approve')
      await handler({ submissionId: 's-1' })

      // Should emit square:claimed to game room
      expect(io.to).toHaveBeenCalledWith('game:g-1')
    })

    it('emits error from transaction', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.$transaction.mockResolvedValue({
        error: 'Submission not found',
      })

      const handler = getHandler(socket, 'review:approve')
      await handler({ submissionId: 's-1' })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Submission not found',
      })
    })

    it('handles discarded result (race lost)', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.$transaction.mockResolvedValue({
        discarded: true,
        roundItemId: 'ri-1',
        teamId: 't-1',
      })

      const handler = getHandler(socket, 'review:approve')
      await handler({ submissionId: 's-1' })

      // Should emit submission:discarded to the team
      expect(io.to).toHaveBeenCalledWith('team:t-1')
    })

    it('notifies discarded teams on approval', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.$transaction.mockResolvedValue({
        approved: true,
        roundItemId: 'ri-1',
        teamId: 't-1',
        teamName: 'Foxes',
        teamColour: '#ff0000',
        discardedTeamIds: ['t-2', 't-3'],
      })
      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
      })
      prisma.roundItem.count = vi.fn().mockResolvedValue(1)

      const handler = getHandler(socket, 'review:approve')
      await handler({ submissionId: 's-1' })

      // Should emit to discarded teams
      expect(io.to).toHaveBeenCalledWith('team:t-2')
      expect(io.to).toHaveBeenCalledWith('team:t-3')
    })

    it('auto-ends game when all squares claimed', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.$transaction.mockResolvedValue({
        approved: true,
        roundItemId: 'ri-1',
        teamId: 't-1',
        teamName: 'Foxes',
        teamColour: '#ff0000',
        discardedTeamIds: [],
      })
      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
      })
      prisma.roundItem.count = vi.fn().mockResolvedValue(0) // all claimed

      const handler = getHandler(socket, 'review:approve')
      await handler({ submissionId: 's-1' })

      const { endGame } = await import('@/server/socket/game')
      expect(endGame).toHaveBeenCalledWith(io, 'g-1')
    })
  })

  describe('review:reject', () => {
    it('emits error when submissionId is missing', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      const handler = getHandler(socket, 'review:reject')
      await handler({})

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'submissionId is required',
      })
    })

    it('rejects and sends next submission to leader', async () => {
      const { getNextPendingSubmission } =
        await import('@/lib/repositories/submission')
      ;(
        getNextPendingSubmission as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: 's-2',
        roundItemId: 'ri-1',
        roundItem: { displayName: 'Oak Tree' },
        team: { name: 'Hawks', colour: '#0000ff' },
        photoUrl: 'https://example.com/photo2.jpg',
      })

      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.$transaction.mockResolvedValue({
        rejected: true,
        roundItemId: 'ri-1',
        teamId: 't-1',
      })

      const handler = getHandler(socket, 'review:reject')
      await handler({ submissionId: 's-1' })

      // Should emit submission:rejected to team and next review:submission to leader
      expect(io.to).toHaveBeenCalledWith('team:t-1')
      expect(socket.emit).toHaveBeenCalledWith(
        'review:submission',
        expect.objectContaining({ roundItemId: 'ri-1' }),
      )
    })

    it('releases lock when no more pending submissions', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.$transaction.mockResolvedValue({
        rejected: true,
        roundItemId: 'ri-1',
        teamId: 't-1',
      })

      const handler = getHandler(socket, 'review:reject')
      await handler({ submissionId: 's-1' })

      const { releaseLock } = await import('@/lib/services/lock-service')
      expect(releaseLock).toHaveBeenCalledWith('ri-1')
    })

    it('emits error from transaction', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.$transaction.mockResolvedValue({
        error: 'You do not hold the lock',
      })

      const handler = getHandler(socket, 'review:reject')
      await handler({ submissionId: 's-1' })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'You do not hold the lock',
      })
    })
  })

  describe('submission:submit — transaction edge cases', () => {
    it('emits discarded when square already claimed', async () => {
      const socket = createMockSocket({
        gameId: 'g-1',
        teamId: 't-1',
        role: 'scout',
      })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
      })
      prisma.roundItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        gameId: 'g-1',
      })
      prisma.team.findUnique.mockResolvedValue({
        id: 't-1',
        gameId: 'g-1',
        socketId: 'sock-1',
      })
      prisma.$transaction.mockResolvedValue({ kind: 'claimed' })

      const handler = getHandler(socket, 'submission:submit')
      await handler({
        roundItemId: 'ri-1',
        photoUrl: 'https://s3.example.com/games/g-1/submissions/photo.webp',
      })

      expect(io.to).toHaveBeenCalledWith('team:t-1')
    })

    it('emits error for duplicate pending submission', async () => {
      const socket = createMockSocket({
        gameId: 'g-1',
        teamId: 't-1',
        role: 'scout',
      })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerSubmissionHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
      })
      prisma.roundItem.findUnique.mockResolvedValue({
        id: 'ri-1',
        gameId: 'g-1',
      })
      prisma.team.findUnique.mockResolvedValue({
        id: 't-1',
        gameId: 'g-1',
        socketId: 'sock-1',
      })
      prisma.$transaction.mockResolvedValue({ kind: 'duplicate' })

      const handler = getHandler(socket, 'submission:submit')
      await handler({
        roundItemId: 'ri-1',
        photoUrl: 'https://s3.example.com/games/g-1/submissions/photo.webp',
      })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'You already have a pending submission for this square',
      })
    })
  })
})
