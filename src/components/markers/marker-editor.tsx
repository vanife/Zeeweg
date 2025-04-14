'use client'

import { useEffect, useState } from 'react'
import * as zeeweg from '@project/anchor'

const markerTypeNames = [
  'basic',
  'park',
  'beach',
  'mountainPeak',
  'historical',
  'restaurant',
  'hazard',
] as const

type MarkerTypeName = (typeof markerTypeNames)[number]

export type MarkerEditorProps = {
  marker: zeeweg.MarkerData
  onCancel: () => void
  onSave: (data: zeeweg.MarkerData) => void
}

export default function MarkerEditor({ marker, onCancel, onSave }: MarkerEditorProps) {
  const [draft, setDraft] = useState(marker)

  useEffect(() => {
    setDraft((prev) => ({
      ...prev,
      position: marker.position,
    }))
  }, [marker.position])

  const canSave =
    draft.title.trim().length > 0 &&
    (draft.position.lat !== 0 || draft.position.lon !== 0)

  const selectedType = Object.keys(draft.markerType)[0] as MarkerTypeName

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">New Marker</h2>

      <input
        className="w-full px-4 py-2 rounded bg-black border border-white text-white"
        type="text"
        placeholder="Title"
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
      />

      <textarea
        className="w-full px-4 py-2 rounded bg-black border border-white text-white"
        rows={3}
        placeholder="Description"
        value={draft.description}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
      />

      <select
        className="w-full px-4 py-2 rounded bg-black border border-white text-white"
        value={selectedType}
        onChange={(e) =>
          setDraft({
            ...draft,
            markerType: { [e.target.value]: {} } as zeeweg.MarkerType,
          })
        }
      >
        {markerTypeNames.map((type) => (
          <option key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </option>
        ))}
      </select>

      <div>
        <label className="text-sm text-white">Latitude</label>
        <input
          className="w-full px-4 py-2 rounded bg-black border border-white text-white"
          type="number"
          value={draft.position.lat / 1e6}
          onChange={(e) =>
            setDraft({
              ...draft,
              position: {
                ...draft.position,
                lat: Math.round(parseFloat(e.target.value) * 1e6),
              },
            })
          }
        />
      </div>

      <div>
        <label className="text-sm text-white">Longitude</label>
        <input
          className="w-full px-4 py-2 rounded bg-black border border-white text-white"
          type="number"
          value={draft.position.lon / 1e6}
          onChange={(e) =>
            setDraft({
              ...draft,
              position: {
                ...draft.position,
                lon: Math.round(parseFloat(e.target.value) * 1e6),
              },
            })
          }
        />
      </div>

      <div className="flex justify-between space-x-2">
        <button
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-40"
          disabled={!canSave}
          onClick={() => onSave(draft)}
        >
          Save
        </button>
      </div>
    </div>
  )
}