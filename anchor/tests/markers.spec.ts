import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import assert from 'assert'

import * as zeeweg from '../src/zeeweg-exports'
import * as helpers from './helpers'

describe('markers', () => {
  anchor.setProvider(anchor.AnchorProvider.env())
  const program = anchor.workspace.Zeeweg as Program<zeeweg.Zeeweg>
  const provider = anchor.getProvider()
  const alice = provider.publicKey as anchor.web3.PublicKey

  // Base position for the marker and tile
  const basePosition: zeeweg.Position = { lat: 43160889, lon: -2934364 } // Bilbao
  const tileX = Math.floor(basePosition.lat / zeeweg.MARKER_TILE_RESOLUTION)
  const tileY = Math.floor(basePosition.lon / zeeweg.MARKER_TILE_RESOLUTION)

  const tilePda = zeeweg.getMarkerTilePda(program, basePosition)

  it('adds a single marker and fails to add this marker again', async () => {
    const marker: zeeweg.MarkerData = {
      title: 'Pinxo Restaurant',
      description: 'Traditional Basque tapas',
      position: basePosition,
      markerType: { restaurant: {} },
    }

    const entryPda = zeeweg.getMarkerEntryPda(program, basePosition)

    // Add the marker first time
    const sig = await program.methods
      .addMarker(marker)
      .accounts({
        author: alice,
        markerEntry: entryPda,
        markerTile: tilePda,
      })
      .rpc()

    console.log('Transaction signature:', sig)
    zeeweg.confirmTransactionWithLatestBlockhash(provider.connection, sig)

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

    // Airdrop 1 SOL to Bob's account
    await helpers.airdrop(provider.connection, bob, 1000000000)

    // Create a new marker for Bob
    const positionBob = { lat: basePosition.lat + 1, lon: basePosition.lon + 1 }

    const marker: zeeweg.MarkerData = {
      title: 'Bob marker',
      description: 'Bob was here too',
      position: positionBob,
      markerType: { beach: {} },
    }

    const entryPda = zeeweg.getMarkerEntryPda(program, positionBob)

    // Add new marker from bob's account
    const sig = await program.methods
      .addMarker(marker)
      .accounts({
        author: bob,
        markerEntry: entryPda,
        markerTile: tilePda,
      })
      .signers([bobKeypair])
      .rpc()

    console.log('Transaction signature:', sig)
    zeeweg.confirmTransactionWithLatestBlockhash(provider.connection, sig)

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