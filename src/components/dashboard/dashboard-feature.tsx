'use client'

import 'ol/ol.css'
import { useState } from 'react'

import MapView from '../map/map-view'
import InstrumentPanel from './instruments-panel'

export default function DashboardFeature() {
  const [isPlacingMarker, setIsPlacingMarker] = useState(false)

  return (
    <div className="flex w-screen h-screen">
      <div className="w-64 shadow-md z-10 p-4">
        <InstrumentPanel onAddMarker={() => setIsPlacingMarker(true)} />
      </div>
      <div className="flex-grow">
        <MapView isPlacingMarker={isPlacingMarker} onMarkerPlaced={() => {
          // TODO: send coordinate to anchor
          setIsPlacingMarker(false)
          }} />
      </div>
    </div>
  )
}