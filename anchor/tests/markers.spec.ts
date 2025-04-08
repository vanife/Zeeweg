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

  // PDA for the tile
  const [tilePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from('marker_tile'),
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
    const [entryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('marker_entry'),
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
        markerEntry: entryPda,
        markerTile: tilePda,
      })
      .rpc()

    console.log('Transaction signature:', tx)

    // Validate entry account
    const entryAccount = await program.account.markerEntry.fetch(entryPda)
    assert.strictEqual(entryAccount.author.toBase58(), alice.toBase58())
    assert.strictEqual(entryAccount.marker.title, marker.title)
    assert.strictEqual(entryAccount.marker.description, marker.description)
    assert.deepStrictEqual(entryAccount.marker.position, basePosition)
    assert.deepStrictEqual(entryAccount.marker.markerType, marker.markerType)

    // Validate tile account
    const tileAccount = await program.account.markerTile.fetch(tilePda)
    assert.strictEqual(tileAccount.tile.x, tileX)
    assert.strictEqual(tileAccount.tile.y, tileY)
    assert.ok(tileAccount.markers.some((m: anchor.web3.PublicKey) => m.equals(entryPda)))

    // Try to add the same marker again
    try {
      await program.methods
        .addMarker(marker)
        .accounts({
          author: alice,
          markerEntry: entryPda,
          markerTile: tilePda,
        } as any)
        .rpc()
      assert.fail('Expected marker creation to fail but it succeeded')
    } catch (err: any) {
      const logs = err.logs?.join('\n') || err.toString()
      assert.ok(logs.includes('already in use'), 'Expected already in use error')
    }
  })

  it('bob adds a marker in the same tile after alice', async () => {
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

    const [entryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('marker_entry'),
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
        markerEntry: entryPda,
        markerTile: tilePda,
      })
      .signers([bobKeypair])
      .rpc()

    console.log('Transaction signature:', tx)

    // Validate entry account
    const entryAccount = await program.account.markerEntry.fetch(entryPda)
    assert.strictEqual(entryAccount.author.toBase58(), bob.toBase58())
    assert.strictEqual(entryAccount.marker.title, marker.title)
    assert.strictEqual(entryAccount.marker.description, marker.description)
    assert.deepStrictEqual(entryAccount.marker.position, positionBob)
    assert.deepStrictEqual(entryAccount.marker.markerType, marker.markerType)

    // Validate tile account
    const tileAccount = await program.account.markerTile.fetch(tilePda)
    assert.strictEqual(tileAccount.tile.x, tileX)
    assert.strictEqual(tileAccount.tile.y, tileY)
    assert.ok(tileAccount.markers.some((m: anchor.web3.PublicKey) => m.equals(entryPda)))
  })
})