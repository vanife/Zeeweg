'use client'

import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Coordinate } from 'ol/coordinate'
import { fromLonLat } from 'ol/proj'

import * as zeeweg from '@project/anchor'

import { getMarkersForTiles } from '@/lib/markers'
import { Settings } from '@/lib/settings'

import MapView, { MapViewApi } from '../map/map-view'
import { useAnchorProvider } from '../solana/solana-provider'
import InstrumentPanel from './markers-panel'

const MAX_TILES_TO_LOAD = 512

export default function MarkersFeature() {
  const saved = Settings.getMapSettings()
  const center = saved ? fromLonLat([saved.lon, saved.lat]) : fromLonLat([0, 0])
  const zoom = saved?.zoom ?? 2

  const provider = useAnchorProvider()
  const mapApiRef = useRef<MapViewApi>(null)

  const onViewportChanged = async (topLeft: Coordinate, bottomRight: Coordinate, zoom: number) => {
    Settings.setMapSettings({
      lon: (topLeft[0] + bottomRight[0]) / 2,
      lat: (topLeft[1] + bottomRight[1]) / 2,
      zoom: zoom,
    })

    const [lonMin, latMax] = topLeft
    const [lonMax, latMin] = bottomRight

    const tileXMin = Math.floor((latMin * 1e6) / zeeweg.MARKER_TILE_RESOLUTION)
    const tileXMax = Math.floor((latMax * 1e6) / zeeweg.MARKER_TILE_RESOLUTION)
    const tileYMin = Math.floor((lonMin * 1e6) / zeeweg.MARKER_TILE_RESOLUTION)
    const tileYMax = Math.floor((lonMax * 1e6) / zeeweg.MARKER_TILE_RESOLUTION)

    const tileCount = (tileXMax - tileXMin + 1) * (tileYMax - tileYMin + 1)
    if (tileCount > MAX_TILES_TO_LOAD) {
      console.warn(`Too many tiles: ${tileCount}, skipping marker load`)
      return
    }

    const tiles: { x: number; y: number }[] = []
    for (let x = tileXMin; x <= tileXMax; x++) {
      for (let y = tileYMin; y <= tileYMax; y++) {
        tiles.push({ x, y })
      }
    }

    try {
      const markers = await getMarkersForTiles(provider, tiles)

      const api = mapApiRef.current
      if (!api) return

      for (const marker of markers) {
        api.upsertSign({
          id: `${marker.position.lat}_${marker.position.lon}`,
          name: marker.title,
          description: marker.description,
          iconUrl: '/map/marker-basic.svg',
          color: '#ff0000',
          position: [marker.position.lat / 1e6, marker.position.lon / 1e6],
        })
      }

    } catch (err) {
      console.error('Failed to load markers:', err)
    }
  }

  return (
    <div className="flex w-screen h-screen">
      <div className="w-64 shadow-md z-10 p-4">
        <InstrumentPanel mapApiRef={mapApiRef} provider={provider} />
      </div>
      <div className="flex-grow">
        <MapView
          apiRef={mapApiRef}
          center={center}
          zoom={zoom}
          onViewportChanged={onViewportChanged}
        />
      </div>
    </div>
  )
}
