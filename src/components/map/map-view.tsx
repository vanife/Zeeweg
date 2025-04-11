'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

import type { Coordinate } from 'ol/coordinate'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import { fromLonLat, toLonLat } from 'ol/proj'
import { Feature } from 'ol'
import Point from 'ol/geom/Point'
import Geometry from 'ol/geom/Geometry'
import Style from 'ol/style/Style'
import Icon from 'ol/style/Icon'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import 'ol/ol.css'

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

export default function MapView({ apiRef, center, zoom, onViewportChanged }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<Map | null>(null)
  const vectorSource = useRef(new VectorSource()).current

  const isPicking = useRef(false)
  const onPick = useRef<((lon: number, lat: number) => void) | null>(null)
  const isMouseInside = useRef(false)
  const pickedPointRef = useRef<Feature | null>(null)
  const hoveringOverFeatureRef = useRef(false)

  const [tooltip, setTooltip] = useState<{ label: string; pixel: [number, number] } | null>(null)
  const [cursor, setCursor] = useState<string>('default')

  const vectorLayer = useRef(
    new VectorLayer({
      source: vectorSource,
      style: (feature) => {
        if (feature.get('pickedPoint')) {
          return new Style({
            image: new CircleStyle({
              radius: 4,
              fill: new Fill({ color: 'magenta' }),
            }),
          })
        }

        return new Style({
          image: new Icon({
            src: feature.get('iconUrl'),
            color: feature.get('color'),
            scale: feature.get('isHovered') ? 1.1 : 1,
          }),
        })
      },
    })
  ).current

  const handlePointerMove = useCallback((e: any) => {
    const map = mapInstance.current
    if (!map) return

    const pixel = map.getEventPixel(e.originalEvent)
    const feature = map.forEachFeatureAtPixel(pixel, (f) => f as Feature<Geometry>) || null

    const hoveringSign = Boolean(feature && !feature.get('pickedPoint'))
    hoveringOverFeatureRef.current = hoveringSign

    if (!isPicking.current) {
      vectorSource.getFeatures().forEach(f => {
        f.set('isHovered', f === feature)
      })
      setCursor('default')
    } else {
      setCursor(hoveringSign ? 'not-allowed' : 'crosshair')
    }

    const tooltipPixel = feature
      ? map.getPixelFromCoordinate((feature.getGeometry() as Point).getCoordinates())
      : null

    if (feature && tooltipPixel)
      setTooltip({
        label: isPicking.current && hoveringSign ? 'Occupied' : feature.get('name') || '',
        pixel: [tooltipPixel[0], tooltipPixel[1] - 24],
      })
    else if (isPicking.current && pixel)
      setTooltip({ label: 'Picking…', pixel: [pixel[0], pixel[1] - 24] })
    else
      setTooltip(null)
  }, [vectorSource])

  useEffect(() => {
    if (!mapRef.current) return

    const view = new View({ center, zoom })
    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), vectorLayer],
      view,
    })

    mapInstance.current = map

    map.on('moveend', () => {
      const extent = view.calculateExtent(map.getSize())
      const topLeft = toLonLat([extent[0], extent[3]]) as Coordinate
      const bottomRight = toLonLat([extent[2], extent[1]]) as Coordinate
      onViewportChanged(topLeft, bottomRight, view.getZoom() || 1)
    })

    map.on('pointermove', handlePointerMove)

    map.on('click', (e) => {
      if (!isPicking.current || hoveringOverFeatureRef.current) return

      const [lon, lat] = toLonLat(e.coordinate)
      onPick.current?.(lon, lat)

      if (pickedPointRef.current) vectorSource.removeFeature(pickedPointRef.current)

      const point = new Feature(new Point(e.coordinate))
      point.set('pickedPoint', true)
      pickedPointRef.current = point
      vectorSource.addFeature(point)
    })

    return () => {
      map.setTarget(undefined)
      if (pickedPointRef.current) vectorSource.removeFeature(pickedPointRef.current)
    }
  }, [center, zoom, onViewportChanged, handlePointerMove, vectorSource, vectorLayer])

  const handleMouseEnter = () => {
    isMouseInside.current = true
  }

  const handleMouseLeave = () => {
    isMouseInside.current = false
    setTooltip(null)
    setCursor('default')
  }

  if (apiRef) {
    apiRef.current = {
      upsertSign: (sign) => {
        const existing = vectorSource.getFeatureById(sign.id)
        if (existing) vectorSource.removeFeature(existing)

        const geometry = new Point(fromLonLat([sign.position[1], sign.position[0]]))
        const feature = new Feature({ geometry })
        feature.setId(sign.id)
        feature.set('iconUrl', sign.iconUrl)
        feature.set('color', sign.color)
        feature.set('name', sign.name)

        vectorSource.addFeature(feature)
      },

      removeSign: (id) => {
        const feature = vectorSource.getFeatureById(id)
        if (feature) vectorSource.removeFeature(feature)
      },

      getCenter: () => {
        const c = mapInstance.current?.getView().getCenter()
        if (!c) return [0, 0]
        const [lon, lat] = toLonLat(c)
        return [lat, lon]
      },

      startPicking: (cb) => {
        onPick.current = cb
        isPicking.current = true
        setCursor('crosshair')
      },

      stopPicking: () => {
        onPick.current = null
        isPicking.current = false
        setCursor('default')

        if (pickedPointRef.current) {
          vectorSource.removeFeature(pickedPointRef.current)
          pickedPointRef.current = null
        }
      }
    }
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-full relative"
      style={{ cursor }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isMouseInside.current && tooltip && (
        <div
          className={`absolute z-20 text-sm px-2 py-1 rounded shadow pointer-events-none ${
            isPicking.current ? 'bg-white text-black' : 'bg-black text-white'
          }`}
          style={{ left: tooltip.pixel[0], top: tooltip.pixel[1] - 28, transform: 'translateX(-50%)' }}
        >
          {tooltip.label}
        </div>
      )}
    </div>
  )
}