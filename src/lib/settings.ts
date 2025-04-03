export type MapSettings = {
    lat: number
    lon: number
    zoom: number
  }

const STORAGE_KEY = 'mapViewport'

export class Settings {
  static getMapSettings(): MapSettings | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (
        typeof parsed.lat === 'number' &&
        typeof parsed.lon === 'number' &&
        typeof parsed.zoom === 'number'
      ) {
        return parsed
      }
    } catch {
      // fail silently
    }
    return null
  }

  static setMapSettings(settings: MapSettings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }
}