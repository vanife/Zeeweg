'use client'

import 'ol/ol.css'
import { useState } from 'react'

import { useAnchorProvider } from '../solana/solana-provider'

import MapView from '../map/map-view'
import InstrumentPanel from './instruments-panel'
import { addMarker } from '@/lib/markers'
import toast from 'react-hot-toast'

export default function DashboardFeature() {
  const provider = useAnchorProvider()

  const [isPlacingMarker, setIsPlacingMarker] = useState(false)

  return (
    <div className="flex w-screen h-screen">
      <div className="w-64 shadow-md z-10 p-4">
        <InstrumentPanel onAddMarker={() => setIsPlacingMarker(true)} />
      </div>
      <div className="flex-grow">
        <MapView isPlacingMarker={isPlacingMarker} onMarkerPlaced={async (lon: number, lat: number) => {

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
          }
          }} />
      </div>
    </div>
  )
}
