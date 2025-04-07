import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Zeeweg } from '../target/types/zeeweg'
import assert from 'assert'

describe('markers', () => {
  anchor.setProvider(anchor.AnchorProvider.env())
  const program = anchor.workspace.Zeeweg as Program<Zeeweg>
  const provider = anchor.getProvider()
  const alice = provider.publicKey as anchor.web3.PublicKey

  const TILE_RESOLUTION = 100_000

  // Base position for the marker
  const basePosition = { lat: 43160889, lon: -2934364 } // Bilbao

  // Compute tile coords
  const tileX = Math.floor(basePosition.lat / TILE_RESOLUTION)
  const tileY = Math.floor(basePosition.lon / TILE_RESOLUTION)

  // PDA for the chunk
  const [chunkPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from('chunk'),
      Buffer.from(new Int32Array([tileX]).buffer),
      Buffer.from(new Int32Array([tileY]).buffer),
    ],
    program.programId
  )

  it('adds a single marker and fails to add this marker again', async () => {
    const marker = {
      title: 'Pinxo Restaurant',
      description: 'Traditional Basque tapas',
      position: basePosition,
      markerType: { restaurant: {} },
    }

    // PDA for the marker itself
    const [markerPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('marker'),
        Buffer.from(new Int32Array([basePosition.lat]).buffer),
        Buffer.from(new Int32Array([basePosition.lon]).buffer),
      ],
      program.programId
    )

    // Add the marker first time
    const tx = await program.methods
      .addMarker(marker)
      .accounts({
        author: alice,
        markerAccount: markerPda,
        markerChunk: chunkPda,
      })
      .rpc()

    console.log('Transaction signature:', tx)

    // Validate marker account
    const markerAccount = await program.account.markerAccount.fetch(markerPda)
    assert.strictEqual(markerAccount.author.toBase58(), alice.toBase58())
    assert.strictEqual(markerAccount.marker.title, marker.title)
    assert.strictEqual(markerAccount.marker.description, marker.description)
    assert.deepStrictEqual(markerAccount.marker.position, basePosition)
    assert.deepStrictEqual(markerAccount.marker.markerType, marker.markerType)

    // Validate chunk account
    const chunkAccount = await program.account.markerChunk.fetch(chunkPda)
    assert.strictEqual(chunkAccount.tile.x, tileX)
    assert.strictEqual(chunkAccount.tile.y, tileY)
    assert.ok(chunkAccount.markers.some((m: anchor.web3.PublicKey) => m.equals(markerPda)))

    // Try to add the same marker again
    try {
      await program.methods
        .addMarker(marker)
        .accounts({
          author: alice,
          markerAccount: markerPda,
          markerChunk: chunkPda,
        })
        .rpc()
      assert.fail('Expected marker creation to fail but it succeeded')
    } catch (err: any) {
      const logs = err.logs?.join('\n') || err.toString()
      assert.ok(logs.includes('already in use'), 'Expected already in use error')
    }
  })

  it('bob adds a marker in the same chunk after alice', async () => {
    // Create a new keypair for Bob
    const bobKeypair = anchor.web3.Keypair.generate()
    const bob = bobKeypair.publicKey

    // Airdrop some SOL to Bob's account
    const sig = await provider.connection.requestAirdrop(bob, 1e9)
    await provider.connection.confirmTransaction(sig)

    // Create a new marker for Bob
    const positionBob = { lat: basePosition.lat + 1, lon: basePosition.lon + 1 }

    const marker = {
      title: 'Bob marker',
      description: 'Bob was here too',
      position: positionBob,
      markerType: { beach: {} },
    }

    const [markerPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('marker'),
        Buffer.from(new Int32Array([positionBob.lat]).buffer),
        Buffer.from(new Int32Array([positionBob.lon]).buffer),
      ],
      program.programId
    )

    // Add new marker from bob's account
    const tx = await program.methods
      .addMarker(marker)
      .accounts({
        author: bob,
        markerAccount: markerPda,
        markerChunk: chunkPda,
      })
      .signers([bobKeypair])
      .rpc()

    console.log('Transaction signature:', tx)

    // Validate marker account
    const markerAccount = await program.account.markerAccount.fetch(markerPda)
    assert.strictEqual(markerAccount.author.toBase58(), bob.toBase58())
    assert.strictEqual(markerAccount.marker.title, marker.title)
    assert.strictEqual(markerAccount.marker.description, marker.description)
    assert.deepStrictEqual(markerAccount.marker.position, positionBob)
    assert.deepStrictEqual(markerAccount.marker.markerType, marker.markerType)

    // Validate chunk account
    const chunkAccount = await program.account.markerChunk.fetch(chunkPda)
    assert.strictEqual(chunkAccount.tile.x, tileX)
    assert.strictEqual(chunkAccount.tile.y, tileY)
    assert.ok(chunkAccount.markers.some((m: anchor.web3.PublicKey) => m.equals(markerPda)))
  })
})