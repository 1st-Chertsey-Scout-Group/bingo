const chains = new Map<string, Promise<unknown>>()

export async function withGameMutex<T>(
  gameId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const prev = chains.get(gameId) ?? Promise.resolve()
  const run = prev.then(fn, fn)
  const settled = run.catch(() => undefined)
  chains.set(gameId, settled)
  try {
    return await run
  } finally {
    if (chains.get(gameId) === settled) {
      chains.delete(gameId)
    }
  }
}
