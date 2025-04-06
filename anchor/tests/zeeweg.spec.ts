import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Zeeweg } from '../target/types/zeeweg'
import assert from 'assert'

describe('zeeweg', () => {
  anchor.setProvider(anchor.AnchorProvider.env())
  const program = anchor.workspace.Zeeweg as Program<Zeeweg>
  const provider = anchor.getProvider()
  const author = provider.publicKey

  const TILE_RESOLUTION = 100_000

  it('adds a marker', async () => {
    const position = { lat: 43160889, lon: -2934364 } // Bilbao

    const marker = {
      title: 'Pinxo Restaurant',
      description: 'Traditional Basque tapas.',
      position,
      markerType: { restaurant: {} },
    }

    // PDA for the marker itself
    const [markerPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('marker'),
        Buffer.from(new Int32Array([position.lat]).buffer),
        Buffer.from(new Int32Array([position.lon]).buffer),
      ],
      program.programId
    )

    // Compute tile coords
    const tileX = Math.floor(position.lat / TILE_RESOLUTION)
    const tileY = Math.floor(position.lon / TILE_RESOLUTION)

    // PDA for the chunk
    const [chunkPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('chunk'),
        Buffer.from(new Int32Array([tileX]).buffer),
        Buffer.from(new Int32Array([tileY]).buffer),
      ],
      program.programId
    )

    // Call the program
    const tx = await program.methods
      .addMarker(marker)
      .accounts({
        author,
        markerAccount: markerPda,
        markerChunk: chunkPda,
      })
      .rpc()

    console.log('Transaction signature:', tx)

    // Validate marker account
    const markerAccount = await program.account.markerAccount.fetch(markerPda)
    assert.strictEqual(markerAccount.author.toBase58(), author.toBase58())
    assert.strictEqual(markerAccount.marker.title, marker.title)
    assert.strictEqual(markerAccount.marker.description, marker.description)
    assert.deepStrictEqual(markerAccount.marker.position, position)
    assert.deepStrictEqual(markerAccount.marker.markerType, marker.markerType)

    // Validate chunk
    const chunkAccount = await program.account.markerChunk.fetch(chunkPda)
    assert.strictEqual(chunkAccount.tile.x, tileX)
    assert.strictEqual(chunkAccount.tile.y, tileY)
    assert.ok(chunkAccount.markers.some((m: anchor.web3.PublicKey) => m.equals(markerPda)))
  })
})