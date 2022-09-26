// @ts-ignore
import * as anchor from '@project-serum/anchor';

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
const { BN, web3, Program, AnchorProvider } = anchor
const { PublicKey, SystemProgram, Transaction } = web3
const utf8 = anchor.utils.bytes.utf8;
const defaultAccounts = {
  tokenProgram: TOKEN_PROGRAM_ID,
  clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  systemProgram: SystemProgram.programId,
}

import { IDL as idl, UnlocStaking } from '../types/unloc_staking'
import { Connection, Keypair } from '@solana/web3.js';
import { createAssociatedTokenAccountIfNotExist2, sendTransaction } from '../utils';
import { STAKING_PDATA, STAKING_PID } from '../global-config';
import { sign } from 'crypto';
let StakingProgram: anchor.Program<UnlocStaking> = null as unknown as anchor.Program<UnlocStaking>

export function initStakingProgram(
  connection: Connection,
  wallet: any,
  programId: any = STAKING_PID
) {

  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    {
      commitment: 'confirmed',
    }

  );
  // Generate the program client from IDL.
  const program = new (anchor as any).Program(idl, programId, provider) as anchor.Program<UnlocStaking>;
  StakingProgram = program

}

export interface ExtraRewardConfigs {
  duration: any
  extraPercentage: any
}

export async function getStakingStateAddress() {
  const [stateSigner, stateBump] = await anchor.web3.PublicKey.findProgramAddress(
    [utf8.encode('state')],
    StakingProgram.programId
  );
  return stateSigner
}

export async function getStakingExtraRewardAddress() {
  const [stateSigner, stateBump] = await anchor.web3.PublicKey.findProgramAddress(
    [utf8.encode('extra')],
    StakingProgram.programId
  );
  return stateSigner
}

async function getStakingPoolAddressFromMint(mint: string) {
  const [stateSigner, stateBump] = await anchor.web3.PublicKey.findProgramAddress(
    [new PublicKey(mint).toBuffer()],
    StakingProgram.programId
  );
  return stateSigner
}
const ACC_PRECISION = new BN(100 * 1000 * 1000 * 1000);
const FULL_100 = new BN(100 * 1000 * 1000 * 1000);
export function estimateRewards(
  stateData: any,
  extraConfigData: any,
  poolData: any,
  userData: any,
) {
  const currentTimeStamp = Math.ceil(new Date().getTime() / 1000);

  const duration = new BN(Math.max(currentTimeStamp - poolData.lastRewardTime, 0))

  const reward_per_share = stateData.tokenPerSecond.mul(duration).mul(ACC_PRECISION).div(poolData.amount);
  const acc_reward_per_share = poolData.accRewardPerShare.add(reward_per_share);

  let extraPercentage = new BN(0)
  extraConfigData.configs.forEach((item: any) => {
    if (item.duration.toString() === userData.lockDuration.toString()) {
      extraPercentage = item.extraPercentage
      return;
    }
  })

  const pending_amount = userData.amount.mul(acc_reward_per_share).div(ACC_PRECISION).sub(userData.rewardDebt);
  const extra_amount = userData.extraReward.add(pending_amount.mul(extraPercentage).div(FULL_100));
  const total_reward = userData.rewardAmount.add(pending_amount).add(extra_amount)

  return total_reward.toString()
}


export function estimateStakingRewardsPerSec(
  stateData: any,
  extraConfigData: any,
  poolData: any,
  userData: any,
) {
  const currentTimeStamp = Math.ceil(new Date().getTime() / 1000);

  const duration = new BN(Math.max(currentTimeStamp - poolData.lastRewardTime, 0))

  const reward_per_share = stateData.tokenPerSecond.mul(duration).mul(ACC_PRECISION).div(poolData.amount);
  const acc_reward_per_share = poolData.accRewardPerShare.add(reward_per_share);

  let extraPercentage = new BN(0)
  extraConfigData.configs.forEach((item: any) => {
    if (item.duration.toString() === userData.lockDuration.toString()) {
      extraPercentage = item.extraPercentage
      return;
    }
  })

  const pending_amount = userData.amount.mul(acc_reward_per_share).div(ACC_PRECISION).sub(userData.rewardDebt);
  const extra_amount = userData.extraReward.add(pending_amount.mul(extraPercentage).div(FULL_100));
  const total_reward = userData.rewardAmount.add(pending_amount).add(extra_amount)
  return ((total_reward / 1000000000) / ((currentTimeStamp - poolData.lastRewardTime.toString()) * 1000));
}

export async function createStakingState(
  connection: Connection,
  wallet: any,
  tokenPerSecond: number,
  earlyUnlocFee: number,
  profileLevels: anchor.BN[],
  rewardMint: string,
  feeVault: string = null,
) {
  const transaction = new Transaction()

  const [stateSigner, stateBump] = await anchor.web3.PublicKey.findProgramAddress(
    [utf8.encode('state')],
    StakingProgram.programId
  );

  const stateRewardVault = await createAssociatedTokenAccountIfNotExist2(
    null,
    stateSigner,
    wallet.publicKey,
    rewardMint,
    transaction
  )
  if(!feeVault){
    feeVault = stateRewardVault.toBase58();
  }

  const tx = await StakingProgram.methods.createState(new BN(tokenPerSecond), new BN(earlyUnlocFee), profileLevels)
  .accounts({
    state: stateSigner,
    rewardVault: stateRewardVault,
    rewardMint: new PublicKey(rewardMint),
    feeVault: new PublicKey(feeVault),
    authority: wallet.publicKey,
    payer: wallet.publicKey,
    stakingProgram: STAKING_PID,
    programData: STAKING_PDATA,
    ...defaultAccounts
  })
  .preInstructions(transaction.instructions)
  .rpc();
  return tx;
}

export async function getStakingState() {
  const stateSigner = await getStakingStateAddress();
  return await StakingProgram.account.stateAccount.fetch(stateSigner)
}

export async function getStakingExtraRewardConfigs() {
  const [extraRewardSigner, extraRewardBump] = await anchor.web3.PublicKey.findProgramAddress(
    [utf8.encode('extra')],
    StakingProgram.programId
  );
  const extraRewardConfigs = await StakingProgram.account.extraRewardsAccount.fetchNullable(extraRewardSigner)
  // assert.ok(extraRewardConfigs.configs.length === 3)
  // assert.ok(new BN(1).eq(extraRewardConfigs.configs[1].duration))
  // assert.ok(getNumber(50).eq(extraRewardConfigs.configs[1].extraPercentage))
  return extraRewardConfigs
}


export async function createStakingExtraReward(
  connection: Connection,
  wallet: any,
) {
  const transaction = new Transaction()
  const signers: Keypair[] = []

  const [extraRewardSigner, extraRewardBump] = await anchor.web3.PublicKey.findProgramAddress(
    [utf8.encode('extra')],
    StakingProgram.programId
  );
  console.log(extraRewardSigner.toString(), extraRewardBump)
  const stateSigner = await getStakingStateAddress();
  const tx = await StakingProgram.instruction.createExtraRewardConfigs(
    [
      { duration: new BN(43200 * 60), extraPercentage: new BN(0) },
      { duration: new BN(129600 * 60), extraPercentage: new BN(10 * 1000 * 1000 * 1000) },
      { duration: new BN(259200 * 60), extraPercentage: new BN(30 * 1000 * 1000 * 1000) },
      { duration: new BN(525600 * 60), extraPercentage: new BN(100 * 1000 * 1000 * 1000) }
    ],
    {
      accounts: {
        state: stateSigner,
        extraRewardAccount: extraRewardSigner,
        authority: wallet.publicKey,
        ...defaultAccounts
      },
    })
  transaction.add(tx)
  return await sendTransaction(connection, wallet, transaction, signers)
}

export async function setStakingExtraReward(
  connection: Connection,
  wallet: any,
  extraRewards: ExtraRewardConfigs[],
) {

  const transaction = new Transaction()
  const signers: Keypair[] = []

  const [extraRewardSigner, extraRewardBump] = await anchor.web3.PublicKey.findProgramAddress(
    [utf8.encode('extra')],
    StakingProgram.programId
  );

  transaction.add(StakingProgram.instruction.setExtraRewardConfigs(extraRewards, {
    accounts: {
      extraRewardAccount: extraRewardSigner,
      authority: wallet.publicKey,
      ...defaultAccounts
    },
  }))
  return await sendTransaction(connection, wallet, transaction, signers)

}


export async function fundToStakingProgram(
  connection: Connection,
  wallet: any,
  poolSigner: string,
  masterRewardVault: string,
  amount: any
) {

  const transaction = new Transaction()
  const signers: Keypair[] = []

  const stateSigner = await getStakingStateAddress()
  const state = await getStakingState()
  // await rewardMint.mintTo(stateRewardVault, wallet, [provider.wallet], getNumber(10000).toString())
  const tx = StakingProgram.instruction.fundRewardToken(new BN(amount), {
    accounts: {
      state: stateSigner,
      rewardVault: state.rewardVault,
      userVault: masterRewardVault,
      authority: wallet.publicKey,
      ...defaultAccounts
    }
  })
  transaction.add(tx)
  return await sendTransaction(connection, wallet, transaction, signers)

}


export async function getAllStakingPools() {
  const pools = await StakingProgram.account.farmPoolAccount.all()
  return pools
}

export async function getFirstStakingPool() {
  const pools = await StakingProgram.account.farmPoolAccount.all()
  return pools[0]
}

export async function createStakingPool(
  connection: Connection,
  wallet: any,
  rewardMint: string,
  pools: any[]
) {

  const transaction = new Transaction()
  const signers: Keypair[] = []


  const [poolSigner, poolBump] = await anchor.web3.PublicKey.findProgramAddress(
    [new PublicKey(rewardMint).toBuffer()],
    StakingProgram.programId
  );
  const stateSigner = await getStakingStateAddress()

  const poolVault = await createAssociatedTokenAccountIfNotExist2(
    null,
    poolSigner,
    wallet.publicKey,
    rewardMint,
    transaction)


  // let pools = await StakingProgram.account.farmPoolAccount.all()
  transaction.add(
    StakingProgram.instruction.createPool(new BN('0'), new BN('0'), {
      accounts: {
        pool: poolSigner,
        state: stateSigner,
        mint: rewardMint,
        vault: poolVault,
        authority: wallet.publicKey,
        payer: wallet.publicKey,
        ...defaultAccounts
      },
      remainingAccounts: pools.map(p => ({
        pubkey: p.publicKey,
        isWritable: true,
        isSigner: false
      }))
    })
  )
  // let stateInfo = await program.account.stateAccount.fetch(stateSigner)
  // let poolInfo = await program.account.farmPoolAccount.fetch(poolSigner)
  // assert.ok(poolInfo.point.eq(stateInfo.totalPoint))
  // assert.ok(poolInfo.point.eq(new BN('0')))
  return await sendTransaction(connection, wallet, transaction, signers)
}
export async function closeStakingPool(
  connection: Connection,
  wallet: any,
  poolSigner: string,
  pools: any[]
) {
  const transaction = new Transaction()
  const signers: Keypair[] = []

  const stateSigner = await getStakingStateAddress()

  StakingProgram.instruction.closePool({
    accounts: {
      pool: new PublicKey(poolSigner),
      state: stateSigner,
      authority: wallet,
      ...defaultAccounts
    },
    remainingAccounts: pools.map(p => ({
      pubkey: p.publicKey,
      isWritable: true,
      isSigner: false
    }))
  })
  return await sendTransaction(connection, wallet, transaction, signers)
}

export async function changeStakingTokenPerSecond(
  connection: Connection,
  wallet: any,
  pools: any[],
  tokenPerSecond: number
) {
  const transaction = new Transaction()
  const signers: Keypair[] = []

  const stateSigner = await getStakingStateAddress()
  const tx = StakingProgram.instruction.changeTokensPerSecond(new BN(tokenPerSecond), {
    accounts: {
      state: stateSigner,
      authority: wallet.publicKey,
      ...defaultAccounts
    },
    remainingAccounts: pools.map(p => ({
      pubkey: p.publicKey,
      isWritable: true,
      isSigner: false
    }))
  })

  transaction.add(tx);
  return await sendTransaction(connection, wallet, transaction, signers)
}
export async function changeStakingPoolPoint(
  connection: Connection,
  wallet: any,
  poolSigner: string,
) {

  const transaction = new Transaction()
  const signers: Keypair[] = []

  const stateSigner = await getStakingStateAddress()

  let pools = await getAllStakingPools()

  const ix = StakingProgram.instruction.changePoolPoint(new BN(1000), {
    accounts: {
      pool: new PublicKey(poolSigner),
      state: stateSigner,
      authority: wallet.publicKey,
      ...defaultAccounts
    },
    remainingAccounts: pools.map((p: any) => ({
      pubkey: p.publicKey,
      isWritable: true,
      isSigner: false
    }))
  })
  transaction.add(ix);
  return await sendTransaction(connection, wallet, transaction, signers)
}

export async function getStakingPoolUserAccount(
  wallet: any,
  poolSigner: any,
) {

  const [poolUserAccount, bump1] = await PublicKey.findProgramAddress([
    poolSigner.toBuffer(), wallet.publicKey.toBuffer()
  ], StakingProgram.programId)

  return await StakingProgram.account.farmPoolUserAccount.fetchNullable(poolUserAccount)
}

const ONE_YEAR_SECOND = 365 * 24 * 3600;
export const TIERS_XCRP = [0, 200, 2000]
export function calculateTiers(amount: number, lockDuration: number) {
  const rate = Number((lockDuration / ONE_YEAR_SECOND).toFixed(3));
  const xCRP = rate * amount;
  let i = 0;
  for (; i < TIERS_XCRP.length; i++) {
    if (TIERS_XCRP[i] > xCRP) {
      break;
    }
  }
  i--;
  return {
    xCRP: Number(xCRP.toFixed(2)),
    tiers: i,
  };
}

export async function stake(
  connection: Connection,
  wallet: any,

  poolSigner: string,

  rewardMint: string,
  poolVault: string,

  rewardUserVault: string,

  amount: any,
  lock = 0,
  signers: Keypair[] = []
) {

  const transaction = new Transaction()

  const stateSigner = await getStakingStateAddress()
  const state = await getStakingState()
  const extraRewardSigner = await getStakingExtraRewardAddress()
  // const poolSigner = await getPoolAddressFromMint(rewardMint)
  const stakeSeed = 10

  const [userAccount, bump1] = await PublicKey.findProgramAddress([
    new PublicKey(poolSigner).toBuffer(), wallet.publicKey.toBuffer(), new anchor.BN(stakeSeed).toBuffer('le', 1)
  ], StakingProgram.programId)
  

  const userAccountData = await StakingProgram.account.farmPoolUserAccount.fetchNullable(userAccount)
  if (!userAccountData) {
    console.log("You are the new user to stake")
    transaction.add(StakingProgram.instruction.createUser({
      accounts: {
        user: userAccount,
        state: stateSigner,
        pool: poolSigner,
        authority: wallet.publicKey,
        payer: wallet.publicKey,
        ...defaultAccounts
      }
    }));
  }
  try {
    const txHash = await StakingProgram.methods.stake(new BN(amount), new BN(lock))
      .accounts({
        mint: rewardMint,
        extraRewardAccount: extraRewardSigner,
        poolVault: poolVault,
        userVault: rewardUserVault,
        feeVault: state.feeVault,
        user: userAccount,
        state: stateSigner,
        pool: poolSigner,
        authority: wallet.publicKey,
        ...defaultAccounts
      })
      .preInstructions(transaction.instructions)
      .signers(signers)
      .rpc()

    return txHash
  } catch (e) {
    console.log(e);
  }
  return '';
}

export async function createStakingUser(
  connection: Connection,
  wallet: any,

  poolSigner: string,
  signers: Keypair[] = [],
  stakeSeed: number
) {

  const stateSigner = await getStakingStateAddress()
  //const stakeSeed = 10;

  const [userAccount, bump1] = await PublicKey.findProgramAddress([
    new PublicKey(poolSigner).toBuffer(), wallet.publicKey.toBuffer(), new anchor.BN(stakeSeed).toBuffer('le', 1)
  ], StakingProgram.programId)

  const userAccountData = await StakingProgram.account.farmPoolUserAccount.fetchNullable(userAccount)
  if (!userAccountData) {
    try {
      const tx = await StakingProgram.methods.createUser(stakeSeed)
        .accounts({
          user: userAccount,
          state: stateSigner,
          pool: poolSigner,
          authority: wallet.publicKey,
          payer: wallet.publicKey,
          ...defaultAccounts
        })
        .signers(signers)
        .rpc()
      return tx;
    } catch (e) {
      console.log(e);
      return null
    }
  }
  return null

}

export async function unstake(
  connection: Connection,
  wallet: any,

  poolSigner: string,
  rewardMint: string,
  poolVault: string,
  rewardUserVault: string,
  amount: number,
  signers: Keypair[] = []
) {

  const stateSigner = await getStakingStateAddress()
  const programState = await getStakingState()
  const stakeSeed= 10

  const extraRewardSigner = await getStakingExtraRewardAddress()
  // const poolSigner = await getPoolAddressFromMint(rewardMint)

  const [poolUserAccount, bump1] = await PublicKey.findProgramAddress([
    new PublicKey(poolSigner).toBuffer(), wallet.publicKey.toBuffer(), new anchor.BN(stakeSeed).toBuffer('le', 1)
  ], StakingProgram.programId)

  try {
    const tx = await StakingProgram.methods.unstake(new BN(amount))
      .accounts({
        mint: rewardMint,
        extraRewardAccount: extraRewardSigner,
        poolVault: poolVault,
        userVault: rewardUserVault,
        feeVault: programState.feeVault,
        user: poolUserAccount,
        state: stateSigner,
        pool: poolSigner,
        authority: wallet.publicKey,
        ...defaultAccounts
      })
      .signers(signers)
      .rpc();

    return tx;
  } catch (e) {
    console.log(e);
    return null
  }
}

export async function harvest(
  connection: Connection,
  wallet: any,
  poolSigner: string,
  rewardMint: string,
  rewardUserVault: string,
  stateRewardVault: string,
  signers: Keypair[] = []
) {

  const stateSigner = await getStakingStateAddress()
  const extraRewardSigner = await getStakingExtraRewardAddress()
  // const poolSigner = await getPoolAddressFromMint(rewardMint)
  const stakeSeed = 10

  const [poolUserAccount, bump1] = await PublicKey.findProgramAddress([
    new PublicKey(poolSigner).toBuffer(), wallet.publicKey.toBuffer(), new anchor.BN(stakeSeed).toBuffer('le', 1)
  ], StakingProgram.programId)


  try {
    const tx = await StakingProgram.methods.harvest()
      .accounts({
        mint: rewardMint,
        extraRewardAccount: extraRewardSigner,
        rewardVault: stateRewardVault,
        userVault: rewardUserVault,
        user: poolUserAccount,
        state: stateSigner,
        pool: poolSigner,
        authority: wallet.publicKey,
        ...defaultAccounts
      })
      .signers(signers)
      .rpc()

    return tx;
  } catch (e) {
    console.log(e);
    return null
  }
}
