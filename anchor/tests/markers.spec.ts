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

  // Create a new keypair for Bob
  const bobKeypair = anchor.web3.Keypair.generate()
  const bob = bobKeypair.publicKey

  // Base position for the marker and tile
  const basePosition: zeeweg.Position = { lat: 43160889, lon: -2934364 } // Bilbao
  const tileX = Math.floor(basePosition.lat / zeeweg.MARKER_TILE_RESOLUTION)
  const tileY = Math.floor(basePosition.lon / zeeweg.MARKER_TILE_RESOLUTION)

  const tilePda = zeeweg.getMarkerTilePda(program, tileX, tileY)
  const entryPda = zeeweg.getMarkerEntryPda(program, basePosition)

  const description: zeeweg.MarkerDescription = {
    name: 'Pinxo Restaurant',
    details: 'Traditional Basque tapas',
    markerType: { restaurant: {} },
  }

  it('Alice adds a single marker', async () => {
    const sig = await program.methods
      .addMarker(description, basePosition)
      .accounts({
        author: alice,
        markerEntry: entryPda,
        markerTile: tilePda,
      } as any)
      .rpc()
    helpers.confirmTransactionWithLatestBlockhash(provider.connection, sig)

    // Validate entry account
    const entryAccount = await program.account.markerEntry.fetch(entryPda)
    assert.strictEqual(entryAccount.author.toBase58(), alice.toBase58())
    assert.deepEqual(entryAccount.description, description)

    // Validate tile account
    let tileAccount = await program.account.markerTile.fetch(tilePda)
    assert.strictEqual(tileAccount.tile.x, tileX)
    assert.strictEqual(tileAccount.tile.y, tileY)
    assert.ok(tileAccount.markers.some((m: anchor.web3.PublicKey) => m.equals(entryPda)))
  })

  it('Alice fails to add the same marker again', async () => {
    const attempt = program.methods
      .addMarker(description, basePosition)
      .accounts({
        author: alice,
        markerEntry: entryPda,
        markerTile: tilePda,
      } as any)
      .rpc()

    await expect(attempt).rejects.toThrow(/already in use/i)
  })

  const updatedDescription: zeeweg.MarkerDescription = {
    name: 'Artxanda',
    details: 'Mountain Peak 251 m',
    markerType: { mountainPeak: {} },
  }

  it('Bob fails to update a marker created by Alice', async () => {
    const attempt = program.methods
      .updateMarker(updatedDescription, basePosition)
      .accounts({
        author: bob,
        markerEntry: entryPda,
        markerTile: tilePda,
      })
      .signers([bobKeypair])
      .rpc()

    // Assert: should throw with has_one = author constraint violation
    await expect(attempt).rejects.toThrow(/has one constraint was violated/i)

    // Should not be updated
    const entryAccount = await program.account.markerEntry.fetch(entryPda)
    assert.strictEqual(entryAccount.author.toBase58(), alice.toBase58())
    assert.deepEqual(entryAccount.description, description)
  })

  it('Alice updates the initial marker', async () => {
    const sig = await program.methods
      .updateMarker(updatedDescription, basePosition)
      .accounts({
        author: alice,
        markerEntry: entryPda,
        markerTile: tilePda,
      })
      .rpc()
    helpers.confirmTransactionWithLatestBlockhash(provider.connection, sig)

    // Should not be updated
    const entryAccount = await program.account.markerEntry.fetch(entryPda)
    assert.strictEqual(entryAccount.author.toBase58(), alice.toBase58())
    assert.deepEqual(entryAccount.description, updatedDescription)
  })

  it('Bob adds a marker in the same tile after Alice', async () => {
    // Airdrop 1 SOL to Bob's account
    await helpers.airdrop(provider.connection, bob, 1000000000)

    // Create a new marker for Bob
    const positionBob = { lat: basePosition.lat + 1, lon: basePosition.lon + 1 }

    const description: zeeweg.MarkerDescription = {
      name: 'Bob marker',
      details: 'Bob was here too',
      markerType: { beach: {} },
    }

    const bobEntryPda = zeeweg.getMarkerEntryPda(program, positionBob)

    // Add new marker from bob's account
    const sig = await program.methods
      .addMarker(description, positionBob)
      .accounts({
        author: bob,
        markerEntry: bobEntryPda,
        markerTile: tilePda,
      } as any)
      .signers([bobKeypair])
      .rpc()
    helpers.confirmTransactionWithLatestBlockhash(provider.connection, sig)

    // Validate entry account
    const entryAccount = await program.account.markerEntry.fetch(bobEntryPda)
    assert.strictEqual(entryAccount.author.toBase58(), bob.toBase58())
    assert.deepEqual(entryAccount.description, description)

    // Validate tile account
    const tileAccount = await program.account.markerTile.fetch(tilePda)
    assert.strictEqual(tileAccount.tile.x, tileX)
    assert.strictEqual(tileAccount.tile.y, tileY)
    assert.ok(tileAccount.markers.some((m: anchor.web3.PublicKey) => m.equals(bobEntryPda)))
  })

  it('Bob fails to delete a marker created by Alice', async () => {
    const attempt = program.methods
      .deleteMarker(basePosition)
      .accounts({
        author: bob,
        markerEntry: entryPda,
        markerTile: tilePda,
      })
      .signers([bobKeypair])
      .rpc()

    // Assert: should throw with has_one = author constraint violation
    await expect(attempt).rejects.toThrow(/has one constraint was violated/i)

    // Confirm marker still exists
    const stillExists = await program.account.markerEntry.fetchNullable(entryPda)
    expect(stillExists).not.toBeNull()
  })

  it('Alice deletes her own marker', async () => {
    // Delete the marker
    const sig = await program.methods
      .deleteMarker(basePosition)
      .accounts({
        author: alice,
        markerEntry: entryPda,
        markerTile: tilePda,
      } as any)
      .rpc()
    helpers.confirmTransactionWithLatestBlockhash(provider.connection, sig)

    const deletedAccount = await program.account.markerEntry.fetchNullable(entryPda)
    expect(deletedAccount).toBeNull()

    const tileAccount = await program.account.markerTile.fetch(tilePda)
    expect(tileAccount.markers).not.toContainEqual(entryPda)
  })
})
