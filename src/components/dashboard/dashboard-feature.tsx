'use client'

import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Coordinate } from 'ol/coordinate'
import { fromLonLat } from 'ol/proj'

import * as zeeweg from '@project/anchor'

import { addMarker, getMarkersForTiles } from '@/lib/markers'
import { Settings } from '@/lib/settings'

import MapView, { MapViewApi } from '../map/map-view'
import { useAnchorProvider } from '../solana/solana-provider'
import InstrumentPanel from './instruments-panel'

const MAX_TILES_TO_LOAD = 512

export default function DashboardFeature() {
  const saved = Settings.getMapSettings()
  const center = saved ? fromLonLat([saved.lon, saved.lat]) : fromLonLat([0, 0])
  const zoom = saved?.zoom ?? 2

  const provider = useAnchorProvider()
  const [isPlacingMarker, setIsPlacingMarker] = useState(false)
  const mapApiRef = useRef<MapViewApi>(null)

  const onMarkerPlaced = async (lon: number, lat: number) => {
    const marker = {
      title: 'My Marker',
      description: 'This is a marker',
      position: {
        lat: lat * 1e6,
        lon: lon * 1e6,
      },
      markerType: { basic: {} },
    }

    try {
      await addMarker(provider, marker)
    } catch (err) {
      toast.error('Could not add marker, error: ' + err)
    } finally {
      setIsPlacingMarker(false)
      toast.success('Marker added')
      // TODO: Load created marker
    }
  }

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
        <InstrumentPanel onAddMarker={() => setIsPlacingMarker(true)} />
      </div>
      <div className="flex-grow">
        <MapView
          apiRef={mapApiRef}
          center={center}
          zoom={zoom}
          isPickingCoordinate={isPlacingMarker}
          onCoordinatePicked={onMarkerPlaced}
          onViewportChanged={onViewportChanged}
        />
      </div>
    </div>
  )
}
