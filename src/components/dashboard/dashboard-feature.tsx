'use client'
import MapView from '../map/map-view'
import 'ol/ol.css'

export default function DashboardFeature() {
  return (
    <div className="w-screen h-screen">
      <MapView />
    </div>
  )
}