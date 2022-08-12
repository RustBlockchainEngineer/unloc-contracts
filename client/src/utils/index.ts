import * as anchor from '@project-serum/anchor'
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    Token,
    TOKEN_PROGRAM_ID,
  } from "@solana/spl-token";
  import {
    Commitment,
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    TransactionSignature,
  } from "@solana/web3.js";
import { RPC_ENDPOINT } from "./../global-config";

export const SOLANA_CONNECTION = new Connection(RPC_ENDPOINT, {
    disableRetryOnRateLimit: true
  })
  
export async function pda(seeds: (Buffer | Uint8Array)[], pid: anchor.web3.PublicKey) {
    const [pdaKey] = await anchor.web3.PublicKey.findProgramAddress(seeds, pid)
    return pdaKey
  }

export const commitment: Commitment = "confirmed";

export async function createAssociatedTokenAccountIfNotExist2(
  account: string | undefined | null,
  owner: PublicKey,
  payer: PublicKey,
  mintAddress: string,

  transaction: Transaction,
  atas: string[] = []
) {
  let publicKey;
  if (account) {
    publicKey = new PublicKey(account);
  }

  const mint = new PublicKey(mintAddress);
  // @ts-ignore without ts ignore, yarn build will failed
  const ata = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    owner,
    true
  );

  if (
    (!publicKey || !ata.equals(publicKey)) &&
    !atas.includes(ata.toBase58())
  ) {
    transaction.add(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        ata,
        owner,
        payer
      )
    );
    atas.push(ata.toBase58());
  }

  return ata;
}

export async function sendTransaction(
  connection: Connection,
  wallet: any,
  transaction: Transaction,
  signers: Array<Keypair> = []
) {
  if (wallet.isProgramWallet) {
    const programWalletTransaction = await covertToProgramWalletTransaction(
      connection,
      wallet,
      transaction,
      signers
    );
    return await wallet.signAndSendTransaction(programWalletTransaction);
  } else {
    const signedTransaction = await signTransaction(
      connection,
      wallet,
      transaction,
      signers
    );
    return await sendSignedTransaction(connection, signedTransaction);
  }
}

// transaction
export async function signTransaction(
  connection: Connection,
  wallet: any,
  transaction: Transaction,
  signers: Array<Keypair> = []
) {
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;
  transaction.setSigners(wallet.publicKey, ...signers.map((s) => s.publicKey));
  if (signers.length > 0) {
    transaction.partialSign(...signers);
  }
  return await wallet.signTransaction(transaction);
}

async function covertToProgramWalletTransaction(
  connection: Connection,
  wallet: any,
  transaction: Transaction,
  signers: Array<Keypair> = []
) {
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash(commitment)
  ).blockhash;
  transaction.feePayer = wallet.publicKey;
  if (signers.length > 0) {
    transaction = await wallet.convertToProgramWalletTransaction(transaction);
    transaction.partialSign(...signers);
  }
  return transaction;
}
export async function sendSignedTransaction(
  connection: Connection,
  signedTransaction: Transaction
): Promise<string> {
  const rawTransaction = signedTransaction.serialize();

  const txid: TransactionSignature = await connection.sendRawTransaction(
    rawTransaction,
    {
      skipPreflight: true,
      preflightCommitment: commitment,
    }
  );

  return txid;
}
