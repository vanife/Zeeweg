'use client'

import { useEffect, useRef } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat, toLonLat } from 'ol/proj'
import 'ol/ol.css'

import { Settings } from '@/lib/settings'

export default function MapView() {
const mapRef = useRef<HTMLDivElement | null>(null)

useEffect(() => {
    if (!mapRef.current) return

    const saved = Settings.getMapSettings()
    const center = saved ? fromLonLat([saved.lon, saved.lat]) : fromLonLat([0, 0])
    const zoom = saved?.zoom ?? 2

    const view = new View({ center, zoom })

    const map = new Map({
    target: mapRef.current,
    layers: [new TileLayer({ source: new OSM() })],
    view,
    })

    map.on('moveend', () => {
      const [lon, lat] = toLonLat(view.getCenter()!)
      const zoom = view.getZoom() || 2
      Settings.setMapSettings({ lon, lat, zoom })
    })

    return () => map.setTarget(undefined)
}, [])

return <div ref={mapRef} className="w-full h-full" />
}