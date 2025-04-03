'use client'

import { useEffect, useRef, useState } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat, toLonLat } from 'ol/proj'
import 'ol/ol.css'

import { Settings } from '@/lib/settings'

type Props = {
  isPlacingMarker: boolean
  onMarkerPlaced: (lon: number, lat: number) => void
}


export default function MapView({ isPlacingMarker, onMarkerPlaced }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const [map, setMap] = useState<Map | null>(null)
  const [mouseCoord, setMouseCoord] = useState<[number, number] | null>(null)
  const [mousePixel, setMousePixel] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    const saved = Settings.getMapSettings()
    const center = saved ? fromLonLat([saved.lon, saved.lat]) : fromLonLat([0, 0])
    const zoom = saved?.zoom ?? 2

    const view = new View({ center, zoom })

    const newMap = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() })],
      view,
    })

    newMap.on('moveend', () => {
      const [lon, lat] = toLonLat(view.getCenter()!)
      const zoom = view.getZoom() || 2
      Settings.setMapSettings({ lon, lat, zoom })
    })

    setMap(newMap)
    return () => newMap.setTarget(undefined)
  }, [])

  useEffect(() => {
    if (!map || !isPlacingMarker) return

    const handleClick = (event: any) => {
      const [lon, lat] = toLonLat(event.coordinate)
      onMarkerPlaced(lon, lat)
    }

    map.once('click', handleClick)

    return () => {
      map.un('click', handleClick)
    }
  }, [map, isPlacingMarker, onMarkerPlaced])

  useEffect(() => {
    if (!map || !isPlacingMarker) return

    const mapEl = map.getTargetElement()

    const handleMouseMove = (event: MouseEvent) => {
      const rect = mapEl.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const pixel = [x, y] as [number, number]
      const coord = toLonLat(map.getCoordinateFromPixel(pixel))
      setMouseCoord([coord[1], coord[0]])
      setMousePixel([x, y])
    }

    mapEl.addEventListener('mousemove', handleMouseMove)
    return () => mapEl.removeEventListener('mousemove', handleMouseMove)
  }, [map, isPlacingMarker])

  return (
    <div ref={mapRef} className="w-full h-full relative">
      {isPlacingMarker && mouseCoord && mousePixel && (
        <div
          className="absolute z-20 bg-white text-sm px-2 py-1 rounded shadow pointer-events-none"
          style={{ left: mousePixel[0] + 12, top: mousePixel[1] + 12 }}
        >
          {mouseCoord[0].toFixed(5)}, {mouseCoord[1].toFixed(5)}
        </div>
      )}
    </div>
  )
}