import { AnchorProvider } from '@coral-xyz/anchor'

import * as zeeweg from '@project/anchor'

export async function addMarker(provider: AnchorProvider, marker: zeeweg.MarkerData): Promise<string> {
  const program = zeeweg.getZeewegProgram(provider)

  const entryPda = zeeweg.getMarkerEntryPda(program, marker.position)

  const tileX = Math.floor(marker.position.lat / zeeweg.MARKER_TILE_RESOLUTION)
  const tileY = Math.floor(marker.position.lon / zeeweg.MARKER_TILE_RESOLUTION)
  const tilePda = zeeweg.getMarkerTilePda(program, tileX, tileY)

  const sig = await program.methods
    .addMarker(marker)
    .accounts({
      author: provider.wallet.publicKey,
      markerEntry: entryPda,
      markerTile: tilePda,
    } as any)
    .rpc()

  const latestBlockHash = await provider.connection.getLatestBlockhash();
  await provider.connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: sig,
  });

  return sig
}

export async function getMarkersForTiles(provider: AnchorProvider, tiles: { x: number; y: number }[]): Promise<zeeweg.MarkerData[]> {
  const program = zeeweg.getZeewegProgram(provider)

  // Step 1: Fetch the tile accounts for the given tiles
  const tilePdas = tiles.map(tile => zeeweg.getMarkerTilePda(program, tile.x, tile.y))
  const tileAccounts = await program.account.markerTile.fetchMultiple(tilePdas)

  const markerPdas = tileAccounts.flatMap(tile => tile?.markers ?? [])

  if (markerPdas.length === 0) return []

  // Step 2: Fetch the marker accounts for the given marker PDAs
  const markerAccounts = await program.account.markerEntry.fetchMultiple(markerPdas)

  // Step 3: Filter out invalid entries and return the markers
  return markerAccounts
    .filter((entry): entry is zeeweg.MarkerEntry => !!entry)
    .map(entry => entry.marker)
}

export async function loadMarkerByLonLat(provider: AnchorProvider, lon: number, lat: number): Promise<zeeweg.MarkerData> {
  const program = zeeweg.getZeewegProgram(provider)

  const entryPda = zeeweg.getMarkerEntryPda(program, { lat, lon })

  const markerAccount = await program.account.markerEntry.fetch(entryPda)
  if (!markerAccount) {
    throw new Error('Marker not found')
  }
  return markerAccount.marker as zeeweg.MarkerData
}