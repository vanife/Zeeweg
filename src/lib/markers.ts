import { AnchorProvider } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'

import { ZEEWEG_PROGRAM_ID, getZeewegProgram, Zeeweg } from '@project/anchor'

const TILE_RESOLUTION = 100_000

export async function addMarker(provider: AnchorProvider, lat: number, lon: number): Promise<string> {
  const program = getZeewegProgram(provider)

  const marker = {
    title: 'Basic marker',
    description: 'Added from UI',
    position: {
      lat: Math.round(lat * 1e6),
      lon: Math.round(lon * 1e6),
    },
    markerType: { basic: {} },
  }

  const [markerPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('marker'),
      Buffer.from(new Int32Array([marker.position.lat]).buffer),
      Buffer.from(new Int32Array([marker.position.lon]).buffer),
    ],
    ZEEWEG_PROGRAM_ID
  )

  const tileX = Math.floor(marker.position.lat / TILE_RESOLUTION)
  const tileY = Math.floor(marker.position.lon / TILE_RESOLUTION)

  const [chunkPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('chunk'),
      Buffer.from(new Int32Array([tileX]).buffer),
      Buffer.from(new Int32Array([tileY]).buffer),
    ],
    ZEEWEG_PROGRAM_ID
  )

  const tx = await program.methods
    .addMarker(marker)
    .accounts({
      author: provider.wallet.publicKey,
      markerAccount: markerPda,
      markerChunk: chunkPda,
      } as any)
      .rpc()

  return tx
}