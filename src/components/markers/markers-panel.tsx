'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AnchorProvider } from '@coral-xyz/anchor'

import MarkerEditor from './marker-editor'
import type { MapViewApi } from '../map/map-view'
import { addMarker, getMarkersByAuthor, Marker } from '@/lib/markers'
import { markerIconAndColorByType } from '@/components/map/map-markers'

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
  const [initialMarker, setInitialMarker] = useState<Marker | null>(null)
  const [createdMarkers, setCreatedMarkers] = useState<Marker[]>([])

  const enterCreateMode = () => {
    const center = mapApiRef.current?.getCenter?.()
    const lat = center?.[0] ?? 0
    const lon = center?.[1] ?? 0

    const newMarker: Marker = {
      description: {
        name: '',
        details: '',
        markerType: { basic: {} },
      },
      position: { lat: Math.round(lat * 1e6), lon: Math.round(lon * 1e6) },
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
    loadMyMarkers()
  }

  const saveMarker = async (marker: Marker) => {
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

  const loadMyMarkers = useCallback(async () => {
    const pubkey = provider.wallet.publicKey
    if (!pubkey) return // not connected

    const all = await getMarkersByAuthor(provider, pubkey)
    setCreatedMarkers(all)
  }, [provider])
  
  useEffect(() => {
    loadMyMarkers()
  }, [loadMyMarkers])

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
        <div className="flex flex-col h-full space-y-4">
          <h2 className="text-lg font-semibold">Markers</h2>

          <button
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-blue-700 transition"
            onClick={enterCreateMode}
          >
            Add New
          </button>

          <h2 className="text-lg font-semibold">Created markers</h2>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1 bg-black/20">
            {createdMarkers.map((marker, i) => {
              const [iconUrl] = markerIconAndColorByType(marker.description.markerType)
              return (
                <div
                  key={i}
                  className="flex items-center space-x-3 p-2 rounded bg-black/10 text-white"
                >
                  <button
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    onClick={() => {
                      mapApiRef.current?.translateToCenter(marker.position.lon / 1e6, marker.position.lat / 1e6)
                    }}
                    >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={iconUrl} alt="icon" className="w-4 h-4" />
                  </button>

                  <span className="text-sm">{marker.description.name || '(Unnamed)'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )
  }
}