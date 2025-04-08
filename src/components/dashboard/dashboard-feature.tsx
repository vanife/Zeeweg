'use client'

import 'ol/ol.css'
import { useState } from 'react'

import { useAnchorProvider } from '../solana/solana-provider'

import MapView from '../map/map-view'
import InstrumentPanel from './instruments-panel'
import { addMarker } from '@/lib/markers'

export default function DashboardFeature() {
  const provider = useAnchorProvider()

  const [isPlacingMarker, setIsPlacingMarker] = useState(false)

  return (
    <div className="flex w-screen h-screen">
      <div className="w-64 shadow-md z-10 p-4">
        <InstrumentPanel onAddMarker={() => setIsPlacingMarker(true)} />
      </div>
      <div className="flex-grow">
        <MapView isPlacingMarker={isPlacingMarker} onMarkerPlaced={(lon: number, lat: number) => {

          addMarker(provider, lon, lat)

          // TODO: send coordinate to anchor
          setIsPlacingMarker(false)
          }} />
      </div>
    </div>
  )
}
