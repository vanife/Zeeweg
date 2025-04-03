type Props = {
  onAddMarker: () => void
}


export default function InstrumentPanel({ onAddMarker }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Instruments</h2>

      <button className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
        Update
      </button>

      <button
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        onClick={onAddMarker}
      >
        Add Marker
      </button>
    </div>
  )
}