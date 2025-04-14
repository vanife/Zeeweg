'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { AnchorProvider } from '@coral-xyz/anchor'

import * as zeeweg from '@project/anchor'

import MarkerEditor from './marker-editor'
import type { MapViewApi } from '../map/map-view'
import { addMarker } from '@/lib/markers'

type Props = {
  mapApiRef: React.MutableRefObject<MapViewApi | null>
  provider: AnchorProvider
  onMarkerUpdated: (lon: number, lat: number) => void
}

enum PanelMode {
  Idle,
  EditingMarker,
}

export default function InstrumentPanel({ mapApiRef, provider, onMarkerUpdated }: Props) {
  const [mode, setMode] = useState<PanelMode>(PanelMode.Idle)
  const [initialMarker, setInitialMarker] = useState<zeeweg.MarkerData | null>(null)

  const enterCreateMode = () => {
    const center = mapApiRef.current?.getCenter?.()
    const lat = center?.[0] ?? 0
    const lon = center?.[1] ?? 0

    const newMarker: zeeweg.MarkerData = {
      title: '',
      description: '',
      position: { lat: Math.round(lat * 1e6), lon: Math.round(lon * 1e6) },
      markerType: { basic: {} },
    }

    setInitialMarker(newMarker)
    setMode(PanelMode.EditingMarker)

    mapApiRef.current?.startPicking(lon, lat, (lon, lat) => {
      setInitialMarker((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          position: {
            lat: Math.round(lat * 1e6),
            lon: Math.round(lon * 1e6),
          },
        }
      })
    })
  }

  const exitCreateMode = () => {
    mapApiRef.current?.stopPicking()
    setMode(PanelMode.Idle)
  }

  const saveMarker = async (marker: zeeweg.MarkerData) => {
    try {
      await addMarker(provider, marker)
    } catch (err) {
      toast.error('Could not add marker, error: ' + err)
    } finally {
      exitCreateMode()
      toast.success('Marker added')
      onMarkerUpdated(marker.position.lon, marker.position.lat)
    }
  }

  switch (mode) {
    case PanelMode.EditingMarker:
      if (!initialMarker) return null
      return (
        <MarkerEditor
          marker={initialMarker}
          onCancel={exitCreateMode}
          onSave={saveMarker}
        />
      )

    case PanelMode.Idle:
    default:
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Markers</h2>
          <button
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-blue-700 transition"
            onClick={enterCreateMode}
          >
            Add New
          </button>
        </div>
      )
  }
}