
import * as anchor from '@coral-xyz/anchor'

// This function is used to confirm a transaction with the latest blockhash
export async function confirmTransactionWithLatestBlockhash(connection: anchor.web3.Connection, sig: string) {
  const latestBlockHash = await connection.getLatestBlockhash();
  await anchor.getProvider().connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: sig,
  });
}

// This function is used to airdrop lamports to a given public key
export async function airdrop(connection: anchor.web3.Connection, publicKey: anchor.web3.PublicKey, lamports: number) {
  const sig = await connection.requestAirdrop(publicKey, lamports);
  await confirmTransactionWithLatestBlockhash(connection, sig);
}