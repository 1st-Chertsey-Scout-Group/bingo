import { createServer } from 'node:http'

import next from 'next'
import { Server as SocketIOServer } from 'socket.io'

import { registerSocketHandlers } from '@/server/socket-handler'
import { startLocationBroadcast } from '@/server/socket/location'

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT ?? '3000', 10)

const nextApp = next({ dev })
const handle = nextApp.getRequestHandler()

nextApp.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res)
  })

  const io = new SocketIOServer(httpServer, {
    cors: dev ? { origin: '*' } : undefined,
  })

  registerSocketHandlers(io)
  startLocationBroadcast(io)

  httpServer.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`)
  })
})
