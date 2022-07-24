
import * as anchor from '@project-serum/anchor';
import SUPER_OWNER_WALLET from '../test-users/super_owner.json'
import UNLOC_TOKEN_KEYPAIR from '../keypairs/unloc-token.json'
import USDC_TOKEN_KEYPAIR from '../keypairs/usdc-token.json'
import { MintLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';

describe('global-init', () => {

  const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
  const superOwner = superOwnerKeypair.publicKey;
  
  const unlocTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(UNLOC_TOKEN_KEYPAIR))
  const usdcTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(USDC_TOKEN_KEYPAIR))
  
  // Configure the client to use the local cluster.
  const envProvider = anchor.AnchorProvider.env();
  const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
  anchor.setProvider(provider);

  it('Is initialized!', async () => {
    
      await safeAirdrop(provider.connection, superOwner, 10)
      let accountRentExempt = await provider.connection.getMinimumBalanceForRentExemption(
          MintLayout.span
          );
      const instructions: TransactionInstruction[] = []
      instructions.push(
        SystemProgram.createAccount({
          fromPubkey: superOwner,
          newAccountPubkey: unlocTokenKeypair.publicKey,
          lamports: accountRentExempt,
          space: MintLayout.span,
          programId: TOKEN_PROGRAM_ID,
        })
      );
    
      instructions.push(
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          unlocTokenKeypair.publicKey,
          6,
          superOwner,
          superOwner
        )
      );

      // create USDC token
      instructions.push(
          SystemProgram.createAccount({
              fromPubkey: superOwner,
              newAccountPubkey: usdcTokenKeypair.publicKey,
              lamports: accountRentExempt,
              space: MintLayout.span,
              programId: TOKEN_PROGRAM_ID,
          })
      );
  
      instructions.push(
          Token.createInitMintInstruction(
              TOKEN_PROGRAM_ID,
              usdcTokenKeypair.publicKey,
              6,
              superOwner,
              superOwner
          )
      );
      const tx = new Transaction()
      tx.add(...instructions)
      await provider.sendAndConfirm(tx, [superOwnerKeypair, unlocTokenKeypair, usdcTokenKeypair], {})
  })
});

async function safeAirdrop(connection: anchor.web3.Connection, key: anchor.web3.PublicKey, amount: number) {
  while (await connection.getBalance(key) < amount * 1000000000){
    try{
      await connection.confirmTransaction(
        await connection.requestAirdrop(key, 1000000000),
        "confirmed"
      );
    }catch{}
  };
}
