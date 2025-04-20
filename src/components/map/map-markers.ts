import { Marker } from "@/lib/markers"
import { MapSign } from "./map-view"

export function markerIconAndColorByType(type: object): [string, string] {
  if ('basic' in type) {
    return ['/map/marker-basic.svg', '#757575'] // gray
  } else if ('park' in type) {
    return ['/map/marker-park.svg', '#4CAF50'] // green
  } else if ('beach' in type) {
    return ['/map/marker-beach.svg', '#03A9F4'] // light blue
  } else if ('mountainPeak' in type) {
    return ['/map/marker-mountain-peak.svg', '#9C27B0'] // purple
  } else if ('historical' in type) {
    return ['/map/marker-historical.svg', '#795548'] // brown
  } else if ('restaurant' in type) {
    return ['/map/marker-restaurant.svg', '#F44336'] // red
  } else if ('hazard' in type) {
    return ['/map/marker-hazard.svg', '#FF9800'] // orange
  } else {
    return ['/map/marker-basic.svg', '#FFFFFF' ] // white
  }
}

export function markerToSign(marker: Marker): MapSign {
  const lat = marker.position.lat / 1e6
  const lon = marker.position.lon / 1e6
  const type = marker.description.markerType

  let [iconUrl, color] = markerIconAndColorByType(type)

  return {
    id: `${lat}_${lon}`,
    name: marker.description.name,
    description: marker.description.details,
    iconUrl,
    color,
    position: [lat, lon],
  }
}