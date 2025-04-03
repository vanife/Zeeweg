import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Zeeweg } from '../target/types/zeeweg'
import assert from 'assert'

describe('zeeweg', () => {
  anchor.setProvider(anchor.AnchorProvider.env())
  const program = anchor.workspace.Zeeweg as Program<Zeeweg>
  const provider = anchor.getProvider()
  const author = provider.publicKey

  it('adds a marker', async () => {
    const position = { lat: 43160889, lon: -2934364 } // Bilbao
    const marker = {
      title: 'Test Marker',
      description: 'This is a test.',
      position,
      markerType: { basic: {} },
    }

    const [markerPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('marker'),
        Buffer.from(new Int32Array([position.lat]).buffer),
        Buffer.from(new Int32Array([position.lon]).buffer),
      ],
      program.programId
    )

    const tx = await program.methods
      .addMarker(marker)
      .accounts({
        author,
        markerAccount: markerPda,
      })
      .rpc()

    console.log('Marker added in transaction', tx)

    const account = await program.account.markerAccount.fetch(markerPda)
    assert.equal(account.author.toBase58(), author.toBase58())
    assert.equal(account.data.title, marker.title)
  })
})