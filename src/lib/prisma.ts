import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@/generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient
  prismaReady: boolean
}

function createClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env['DATABASE_URL'] ?? '',
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma || createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Enable WAL mode and set busy timeout for concurrent access.
// Runs once per process — the pragmas persist for the connection lifetime.
if (!globalForPrisma.prismaReady) {
  globalForPrisma.prismaReady = true
  void Promise.all([
    prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL'),
    prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000'),
    prisma.$executeRawUnsafe('PRAGMA synchronous = NORMAL'),
  ])
}
