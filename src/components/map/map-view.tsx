'use client'

import { useEffect, useRef, useState } from 'react'

import type { Coordinate } from 'ol/coordinate'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat, toLonLat } from 'ol/proj'
import 'ol/ol.css'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import { Feature } from 'ol'
import Point from 'ol/geom/Point'
import Style from 'ol/style/Style'
import Icon from 'ol/style/Icon'

export type MapSign = {
  id: string
  name: string
  description: string
  iconUrl: string
  color: string
  position: [number, number] // [lon, lat]
}

export type MapViewApi = {
  upsertSign: (sign: MapSign) => void
  removeSign: (id: string) => void
  getCenter: () => [number, number]
  startPicking: (onPick: (lon: number, lat: number) => void) => void
  stopPicking: () => void
}

type Props = {
  apiRef?: React.MutableRefObject<MapViewApi | null>
  center: Coordinate
  zoom: number
  onViewportChanged: (topLeft: Coordinate, bottomRight: Coordinate, zoom: number) => void
}

export default function MapView({
  apiRef,
  center,
  zoom,
  onViewportChanged,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const [map, setMap] = useState<Map | null>(null)
  const [mouseCoord, setMouseCoord] = useState<[number, number] | null>(null)
  const [mousePixel, setMousePixel] = useState<[number, number] | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isPicking, setIsPicking] = useState(false)
  const onPickRef = useRef<((lon: number, lat: number) => void) | null>(null)

  const vectorSourceRef = useRef(new VectorSource())
  const vectorLayerRef = useRef(new VectorLayer({ source: vectorSourceRef.current }))

  useEffect(() => {
    if (!mapRef.current) return

    const view = new View({ center, zoom })

    const newMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        vectorLayerRef.current,
      ],
      view,
    })

    newMap.on('moveend', () => {
      const extent = view.calculateExtent(newMap.getSize())
      const topLeft = toLonLat([extent[0], extent[3]]) as Coordinate
      const bottomRight = toLonLat([extent[2], extent[1]]) as Coordinate
      const zoom = view.getZoom() || 1
      onViewportChanged(topLeft, bottomRight, zoom)
    })

    setMap(newMap)
    return () => newMap.setTarget(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!map) return
    const mapEl = map.getTargetElement()

    const handleMouseEnter = () => setIsHovered(true)
    const handleMouseLeave = () => setIsHovered(false)
    const handleMouseMove = (event: MouseEvent) => {
      if (!isPicking) return

      const rect = mapEl.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const pixel = [x, y] as [number, number]
      const coord = toLonLat(map.getCoordinateFromPixel(pixel))

      setMouseCoord([coord[1], coord[0]])
      setMousePixel([x, y])
    }

    const handleClick = (event: any) => {
      if (!isPicking) return

      const [lon, lat] = toLonLat(event.coordinate)
      onPickRef.current?.(lon, lat)
    }

    mapEl.addEventListener('mouseenter', handleMouseEnter)
    mapEl.addEventListener('mouseleave', handleMouseLeave)
    mapEl.addEventListener('mousemove', handleMouseMove)
    map.on('click', handleClick)

    mapEl.style.cursor = isPicking ? 'crosshair' : ''

    return () => {
      mapEl.removeEventListener('mouseenter', handleMouseEnter)
      mapEl.removeEventListener('mouseleave', handleMouseLeave)
      mapEl.removeEventListener('mousemove', handleMouseMove)
      map.un('click', handleClick)
    }
  }, [map, isPicking])

  useEffect(() => {
    if (!apiRef) return

    const upsertSign = (sign: MapSign) => {
      const existing = vectorSourceRef.current.getFeatureById(sign.id)
      const feature = new Feature({
        geometry: new Point(fromLonLat([sign.position[1], sign.position[0]])),
        name: sign.name,
        description: sign.description,
      })
      feature.setId(sign.id)
      feature.setStyle(
        new Style({
          image: new Icon({
            src: sign.iconUrl,
            color: sign.color,
            scale: 1,
          }),
        })
      )
      if (existing) {
        vectorSourceRef.current.removeFeature(existing)
      }
      vectorSourceRef.current.addFeature(feature)
    }

    const removeSign = (id: string) => {
      const existing = vectorSourceRef.current.getFeatureById(id)
      if (existing) {
        vectorSourceRef.current.removeFeature(existing)
      }
    }

    const getCenter = (): [number, number] => {
      const center = map?.getView().getCenter()
      if (!center) return [0, 0]
      const [lon, lat] = toLonLat(center)
      return [lat, lon]
    }

    const startPicking = (onPick: (lon: number, lat: number) => void) => {
      onPickRef.current = onPick
      setIsPicking(true)
    }

    const stopPicking = () => {
      onPickRef.current = null
      setIsPicking(false)
    }

    apiRef.current = { upsertSign, removeSign, getCenter, startPicking, stopPicking }
  }, [apiRef, map])

  return (
    <div ref={mapRef} className="w-full h-full relative">
      {isPicking && isHovered && mouseCoord && mousePixel && (
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