'use client'

import dynamic from 'next/dynamic'
import type { TeamPosition } from '@/types'

const TeamMapInner = dynamic(
  () =>
    import('@/components/TeamMap').then((mod) => ({
      default: mod.TeamMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        Loading map...
      </div>
    ),
  },
)

export function TeamMapDynamic({ positions }: { positions: TeamPosition[] }) {
  return <TeamMapInner positions={positions} />
}
