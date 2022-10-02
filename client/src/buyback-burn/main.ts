import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  BUYBACK_PDATA,
  BUYBACK_PID,
  defaults,
  UNLOC_MINT,
  USDC_MINT,
  WSOL_MINT,
} from "./../global-config";
import { pda, SOLANA_CONNECTION } from "./../utils";
import { UnlocBurn, IDL } from "../types/unloc_burn";
import { Liquidity, SERUM_PROGRAM_ID_V3 } from "@unloc-dev/raydium-sdk";
import { getAssociatedPoolKeys, getMarket, getVaultOwnerAndNonce } from "./buyback-utils";

export const BUYBACK_GLOBAL_STATE_SEED = Buffer.from("GLOBAL_STATE_SEED");
export const UNLOC_VAULT_SEED = Buffer.from("UNLOC_VAULT_SEED");
export const WSOL_VAULT_SEED = Buffer.from("WSOL_VAULT_SEED");
export const USDC_VAULT_SEED = Buffer.from("USDC_VAULT_SEED");

export let buybackProgram: anchor.Program<UnlocBurn> =
  null as unknown as anchor.Program<UnlocBurn>;
export let buybackProgramProvider: anchor.AnchorProvider =
  null as unknown as anchor.AnchorProvider;
export let buybackProgramId: anchor.web3.PublicKey =
  null as unknown as anchor.web3.PublicKey;

export const initBuybackProgram = (
  wallet: any,
  connection: anchor.web3.Connection = SOLANA_CONNECTION,
  pid: anchor.web3.PublicKey = BUYBACK_PID
) => {
  buybackProgramId = pid;
  // const provider = new anchor.Provider(connection, wallet, anchor.Provider.defaultOptions())
  const provider = new anchor.AnchorProvider(connection, wallet, {
    skipPreflight: true,
  });
  buybackProgramProvider = provider;

  // Generate the program client from IDL.
  buybackProgram = new (anchor as any).Program(
    IDL,
    buybackProgramId,
    provider
  ) as anchor.Program<UnlocBurn>;
};

export const getUnlocVaultKey = async () => {
  const unlocVault = await pda([UNLOC_VAULT_SEED], buybackProgramId);
  return unlocVault
}
export const getUsdcVaultKey = async () => {
  const usdcVault = await pda([USDC_VAULT_SEED], buybackProgramId);
  return usdcVault
}
export const getWsolVaultKey = async () => {
  const wsolVault = await pda([WSOL_VAULT_SEED], buybackProgramId);
  return wsolVault
}
export const createBuybackGlobalState = async (
  newBurner: PublicKey,
  amm: PublicKey,
  serumMarket: PublicKey,
  ammProgram: PublicKey = Liquidity.getProgramId(4),
  serumProgram: PublicKey = SERUM_PROGRAM_ID_V3,
  signer: anchor.web3.PublicKey = buybackProgramProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const globalState = await pda([BUYBACK_GLOBAL_STATE_SEED], buybackProgramId);
  const unlocVault = await pda([UNLOC_VAULT_SEED], buybackProgramId);
  const usdcVault = await pda([USDC_VAULT_SEED], buybackProgramId);
  const wsolVault = await pda([WSOL_VAULT_SEED], buybackProgramId);
  const superOwner = signer;

  const tx = await buybackProgram.methods.createGlobalState(newBurner)
    .accounts({
      authority: superOwner,
      globalState,
      unlocMint: UNLOC_MINT,
      unlocVault,
      usdcMint: USDC_MINT,
      usdcVault,
      wsolMint: WSOL_MINT,
      wsolVault,
      ammProgram,
      amm,
      serumProgram,
      serumMarket,
      burnProgram: BUYBACK_PID,
      programData: BUYBACK_PDATA,
      ...defaults,
    })
    .signers(signers)
    .rpc()

  // eslint-disable-next-line no-console
  console.log("createGlobalState tx = ", tx);
};
export const updateBuybackGlobalState = async (
  newAuthority: PublicKey,
  newBurner: PublicKey,
  amm: PublicKey,
  serumMarket: PublicKey,
  ammProgram: PublicKey = Liquidity.getProgramId(4),
  serumProgram: PublicKey = SERUM_PROGRAM_ID_V3,
  signer: anchor.web3.PublicKey = buybackProgramProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const globalState = await pda([BUYBACK_GLOBAL_STATE_SEED], buybackProgramId);
  const superOwner = signer;

  const tx = await buybackProgram.methods.updateGlobalState(newAuthority, newBurner)
    .accounts({
      authority: superOwner,
      globalState,
      ammProgram,
      amm,
      serumProgram,
      serumMarket,
      ...defaults,
    })
    .signers(signers)
    .rpc()

  // eslint-disable-next-line no-console
  console.log("updateGlobalState tx = ", tx);
};

// backend api will call this function regularly
export const burn = async () => {
  const globalState = await pda([BUYBACK_GLOBAL_STATE_SEED], buybackProgramId);
  const unlocVault = await pda([UNLOC_VAULT_SEED], buybackProgramId);

  const tx = await buybackProgram.methods.burn()
    .accounts({
      globalState,
      unlocMint: UNLOC_MINT,
      unlocVault,
      ...defaults,
    })
    .rpc()

  // eslint-disable-next-line no-console
  console.log("setGlobalState tx = ", tx);
};

// backend api will call this function regularly
export const buyback = async (
  ammProgram: PublicKey = Liquidity.getProgramId(4),
  serumProgram: PublicKey = SERUM_PROGRAM_ID_V3,
) => {
  const globalState = await pda([BUYBACK_GLOBAL_STATE_SEED], buybackProgramId);
  const globalStateData = await buybackProgram.account.globalState.fetch(globalState)
  const amm = globalStateData.amm
  const serumMarket = globalStateData.serumMarket

  const market = await getMarket(buybackProgram.provider.connection, serumMarket.toBase58(), serumProgram.toBase58())

  const poolKeys = await getAssociatedPoolKeys({
    programId: ammProgram,
    serumProgramId: serumProgram,
    marketId: market.address,
    baseMint: market.baseMintAddress as any,
    quoteMint: market.quoteMintAddress as any
  })

  const ammAuthority = poolKeys.authority
  const poolCoinTokenAccount: PublicKey = poolKeys.baseVault
  const poolPcTokenAccount: PublicKey = poolKeys.quoteVault
  const ammTargetOrders: PublicKey = poolKeys.targetOrders
  const ammOpenOrders: PublicKey = poolKeys.openOrders
  const serumBids: PublicKey = market.bidsAddress as any;
  const serumAsks: PublicKey = market.asksAddress as any;
  const serumEventQueue: PublicKey = market.decoded.eventQueue as any;
  const serumCoinVaultAccount: PublicKey = market.decoded.baseVault as any;
  const serumPcVaultAccount: PublicKey = market.decoded.quoteVault as any;
  const vaultOwnerData = await getVaultOwnerAndNonce(market.address, serumProgram);
  const serumVaultSigner = vaultOwnerData.vaultOwner

  const unlocVault = await pda([UNLOC_VAULT_SEED], buybackProgramId);
  const usdcVault = await pda([USDC_VAULT_SEED], buybackProgramId);

  const tx = await buybackProgram.methods.buyback()
    .accounts({
      globalState,
      ammProgram,
      amm,
      ammAuthority,
      ammOpenOrders,
      ammTargetOrders,
      poolCoinTokenAccount,
      poolPcTokenAccount,
      serumProgram,
      serumMarket,
      serumBids,
      serumAsks,
      serumEventQueue,
      serumCoinVaultAccount,
      serumPcVaultAccount,
      serumVaultSigner,
      userSourceTokenAccount: usdcVault,
      userDestinationTokenAccount: unlocVault,
      splTokenProgram: defaults.tokenProgram,
    })
    .rpc()

  // eslint-disable-next-line no-console
  console.log("setGlobalState tx = ", tx);
};

export const getBuybackGlobalState = async () => {
  const globalState = await pda([BUYBACK_GLOBAL_STATE_SEED], buybackProgramId);
  return await buybackProgram.account.globalState.fetch(globalState)
};
