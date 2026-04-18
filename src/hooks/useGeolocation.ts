'use client'

import { useEffect, useRef } from 'react'
import type { Socket } from 'socket.io-client'
import { toast } from 'sonner'

const MIN_DISTANCE_M = 5

function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = (lat2 - lat1) * 111_320
  const dLng = (lng2 - lng1) * 111_320 * Math.cos((lat1 * Math.PI) / 180)
  return Math.sqrt(dLat * dLat + dLng * dLng)
}

export function useGeolocation(socket: Socket | null, active: boolean): void {
  const lastSent = useRef<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!active || !socket) return
    if (typeof navigator === 'undefined' || !navigator.geolocation) return

    const onPosition = (pos: GeolocationPosition) => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords

      if (lastSent.current) {
        const dist = distanceMeters(
          lastSent.current.lat,
          lastSent.current.lng,
          lat,
          lng,
        )
        if (dist < MIN_DISTANCE_M) return
      }

      lastSent.current = { lat, lng }
      socket.emit('location:update', { lat, lng, accuracy })
    }

    const onError = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) {
        toast('Location sharing unavailable')
      }
    }

    const watchId = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: false,
      maximumAge: 10_000,
      timeout: 15_000,
    })

    return () => {
      navigator.geolocation.clearWatch(watchId)
      lastSent.current = null
    }
  }, [socket, active])
}
