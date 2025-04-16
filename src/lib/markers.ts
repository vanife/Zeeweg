import { AnchorProvider } from '@coral-xyz/anchor'

import * as zeeweg from '@project/anchor'

export interface Marker {
  description: zeeweg.MarkerDescription
  position: zeeweg.Position
}

export async function addMarker(provider: AnchorProvider, marker: Marker): Promise<string> {
  const program = zeeweg.getZeewegProgram(provider)

  const entryPda = zeeweg.getMarkerEntryPda(program, marker.position)

  const tileX = Math.floor(marker.position.lat / zeeweg.MARKER_TILE_RESOLUTION)
  const tileY = Math.floor(marker.position.lon / zeeweg.MARKER_TILE_RESOLUTION)
  const tilePda = zeeweg.getMarkerTilePda(program, tileX, tileY)

  const sig = await program.methods
    .addMarker(marker.description, marker.position)
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

export async function getMarkersForTiles(provider: AnchorProvider, tiles: { x: number; y: number }[]): Promise<Marker[]> {
  const program = zeeweg.getZeewegProgram(provider)

  // Step 1: Get PDAs for each tile
  const tilePdas = tiles.map(tile => zeeweg.getMarkerTilePda(program, tile.x, tile.y))

  // Step 2: Fetch tile accounts
  const tileAccounts = await program.account.markerTile.fetchMultiple(tilePdas)

  // Step 3: Extract all marker PDAs from those tiles
  const markerPdas = tileAccounts.flatMap(tile => tile?.markers ?? [])

  if (markerPdas.length === 0) return []

  // Step 4: Fetch marker entries
  const markerEntries = await program.account.markerEntry.fetchMultiple(markerPdas)

  // Step 5: Combine entries with decoded positions
  return markerEntries
    .filter((entry): entry is zeeweg.MarkerEntry => !!entry)
    .map((entry) => ({
      description: entry.description,
      position: entry.position,
    }))
}

export async function loadMarkerByLonLat(provider: AnchorProvider, lon: number, lat: number): Promise<Marker> {
  const program = zeeweg.getZeewegProgram(provider)

  const entryPda = zeeweg.getMarkerEntryPda(program, { lat, lon })

  const markerAccount = await program.account.markerEntry.fetch(entryPda)
  if (!markerAccount) {
    throw new Error('Marker not found')
  }

  return {
    description: markerAccount.description as zeeweg.MarkerDescription,
    position: markerAccount.position as zeeweg.Position,
  }
}