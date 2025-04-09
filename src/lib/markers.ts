import { AnchorProvider } from '@coral-xyz/anchor'

import * as zeeweg from '@project/anchor'

export async function addMarker(provider: AnchorProvider, marker: zeeweg.MarkerData): Promise<string> {
  const program = zeeweg.getZeewegProgram(provider)

  const entryPda = zeeweg.getMarkerEntryPda(program, marker.position)
  const tilePda = zeeweg.getMarkerTilePda(program, marker.position)

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
