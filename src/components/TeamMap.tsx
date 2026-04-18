'use client'

import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet'
import type { TeamPosition } from '@/types'

type TeamMapProps = {
  positions: TeamPosition[]
}

// Abbeyfield, Chertsey — centre of the park
const DEFAULT_CENTER: [number, number] = [51.394299, -0.503354]
const DEFAULT_ZOOM = 17

export function TeamMap({ positions }: TeamMapProps) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {positions.map((pos) => (
        <CircleMarker
          key={pos.teamId}
          center={[pos.lat, pos.lng]}
          radius={10}
          fillColor={pos.teamColour}
          color="white"
          weight={2}
          fillOpacity={0.9}
        >
          <Tooltip direction="top" offset={[0, -10]} permanent>
            {pos.teamName}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
