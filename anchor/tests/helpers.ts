
import * as anchor from '@coral-xyz/anchor'
import * as zeeweg from '../src/zeeweg-exports'

export async function airdrop(connection: anchor.web3.Connection, publicKey: anchor.web3.PublicKey, lamports: number) {
    const sig = await connection.requestAirdrop(publicKey, lamports);
    await zeeweg.confirmTransactionWithLatestBlockhash(connection, sig);
  }