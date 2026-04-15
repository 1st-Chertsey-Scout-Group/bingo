'use client'

type TeamBadgeProps = {
  name: string
  colour: string
}

export function TeamBadge({ name, colour }: TeamBadgeProps) {
  return (
    <span
      className="rounded-full px-3 py-1 text-sm font-semibold text-white"
      style={{ backgroundColor: colour }}
    >
      {name}
    </span>
  )
}
