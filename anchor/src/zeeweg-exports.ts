// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import ZeewegIDL from '../target/idl/zeeweg.json'
import type { Zeeweg } from '../target/types/zeeweg'

// Re-export the generated IDL and type
export { Zeeweg, ZeewegIDL }

// The programId is imported from the program IDL.
export const ZEEWEG_PROGRAM_ID = new PublicKey(ZeewegIDL.address)

// This is a helper function to get the Basic Anchor program.
export function getZeewegProgram(provider: AnchorProvider) {
  return new Program(ZeewegIDL as Zeeweg, provider)
}
