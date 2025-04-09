// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import * as anchor from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import ZeewegIDL from '../target/idl/zeeweg.json'
import type { Zeeweg } from '../target/types/zeeweg'

// Re-export the generated IDL and type
export { Zeeweg, ZeewegIDL }

// The programId is imported from the program IDL.
export const ZEEWEG_PROGRAM_ID = new PublicKey(ZeewegIDL.address)

// This is a helper function to get the Basic Anchor program.
export function getZeewegProgram(provider: AnchorProvider) {
  return new Program(ZeewegIDL as Zeeweg, provider)
}

// Markers helpers

export const MARKER_TILE_RESOLUTION = 100_000

// This marker type enumeration, should match MarkerType from state.rs
export type MarkerType =
  | { basic: {} }
  | { park: {} }
  | { beach: {} }
  | { mountainPeak: {} }
  | { historical: {} }
  | { restaurant: {} }
  | { hotel: {} }
  | { hospital: {} }
  | { hazard: {} }

// This is the position type, should match Position from state.rs
export interface Position {
  lat: number // in microdegrees
  lon: number // in microdegrees
}

// This is the marker data type, should match MarkerData from state.rs
export interface MarkerData {
  title: string
  description: string
  position: Position
  markerType: MarkerType
}

// MarkerEntry PDA depends on the position (lat, lon)
export function getMarkerEntryPda(program: Program<Zeeweg>, position: Position): PublicKey {
  const [entryPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from('marker_entry'),
      Buffer.from(new Int32Array([position.lat]).buffer),
      Buffer.from(new Int32Array([position.lon]).buffer),
    ],
    program.programId
  )
  return entryPda
}

// MarkerTile PDA depends on the position (lat, lon) dvided by the tile resolution
export function getMarkerTilePda(program: Program<Zeeweg>, position: Position): PublicKey {
  const tileX = Math.floor(position.lat / MARKER_TILE_RESOLUTION)
  const tileY = Math.floor(position.lon / MARKER_TILE_RESOLUTION)

  const [tilePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from('marker_tile'),
      Buffer.from(new Int32Array([tileX]).buffer),
      Buffer.from(new Int32Array([tileY]).buffer),
    ],
    program.programId
  )
  return tilePda
}

// This function is used to confirm a transaction with the latest blockhash
export async function confirmTransactionWithLatestBlockhash(connection: anchor.web3.Connection, sig: string) {
  const latestBlockHash = await connection.getLatestBlockhash();
  await anchor.getProvider().connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: sig,
  });
}
