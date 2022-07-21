
import * as anchor from '@project-serum/anchor';

export async function safeAirdrop(connection: anchor.web3.Connection, key: anchor.web3.PublicKey, amount: number) {
    while (await connection.getBalance(key) < amount * 1000000000){
      try{
        await connection.confirmTransaction(
          await connection.requestAirdrop(key, 1000000000),
          "confirmed"
        );
      }catch{}
    };
  }
  
  export async function pda(seeds: (Buffer | Uint8Array)[], programId: anchor.web3.PublicKey) {
    const [pdaKey] =
      await anchor.web3.PublicKey.findProgramAddress(
        seeds,
        programId,
      );
    return pdaKey
  }