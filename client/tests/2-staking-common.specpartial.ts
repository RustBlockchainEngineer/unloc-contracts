import * as anchor from '@project-serum/anchor';
const { BN, web3 } = anchor
import { TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import _ from 'lodash';
import assert from 'assert';
import { assertError, wrapError } from './staking-utils';

import { UnlocStaking } from '../src/types/unloc_staking'
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { changeStakingTokenPerSecond, createStakingState, createStakingUser, harvest, initStakingProgram, stake as unlocStake, unstake as unlocUnstake } from '../src';
import LOANER1_WALLET from './test-users/lender1.json'
import SUPER_OWNER_WALLET from './test-users/super_owner.json'
import BORROWER1_KEYPAIR from './test-users/borrower1.json'
import { UNLOC_MINT } from '../src/global-config';
import { UnlocLoan } from '../src/types/unloc_loan';
import { getStakingStateAddress, getStakingExtraRewardAddress, getStakingState } from '../src/staking'

let stateSigner = Keypair.generate().publicKey
let stateBump = 255
let stateRewardVault = Keypair.generate().publicKey

let extraRewardSigner = Keypair.generate().publicKey
let extraRewardBump = 255

let rewardMint: Token = null as any
let poolSigner = Keypair.generate().publicKey
export let poolVault = Keypair.generate().publicKey
let poolBump = 255

const lender1Keypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(LOANER1_WALLET))
const lender1 = lender1Keypair.publicKey;
const GLOBAL_STATE_TAG = Buffer.from('GLOBAL_STATE_SEED')

let lpMint: Token = null as any
let lpPoolSigner = Keypair.generate().publicKey
let lpPoolVault = Keypair.generate().publicKey
let lpPoolBump = 255


const borrower1Keypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(BORROWER1_KEYPAIR))
const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))

const utf8 = anchor.utils.bytes.utf8;
const envProvider = anchor.AnchorProvider.env();
const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
anchor.setProvider(provider);

let creatorKey = superOwnerKeypair.publicKey
let program = anchor.workspace.UnlocStaking as anchor.Program<UnlocStaking>
let connection = provider.connection

const loanProgram = anchor.workspace.UnlocLoan as anchor.Program<UnlocLoan>;

const cccc = new Connection(connection.rpcEndpoint, { commitment: 'confirmed' })

initStakingProgram(cccc, new anchor.Wallet(superOwnerKeypair), program.programId);


const borrower1 = {
  lastHarvestTime1: 0,
  user: borrower1Keypair,
  publicKey: borrower1Keypair.publicKey,
  wallet: new anchor.Wallet(borrower1Keypair),
  provider: new anchor.AnchorProvider(connection, new anchor.Wallet(borrower1Keypair), { commitment: 'confirmed' }),
  userAccount1: borrower1Keypair.publicKey,
  bump1: 255,
  rewardUserVault: borrower1Keypair.publicKey,
  rewardAmount: new anchor.BN(0)
}
let users = _.map(new Array(10), () => {
  const user = anchor.web3.Keypair.generate();
  const publicKey = user.publicKey
  const rewardUserVault = user.publicKey
  const rewardAmount = new anchor.BN(0)
  const wallet = new anchor.Wallet(user)
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' })
  const userAccount1 = user.publicKey
  const bump1 = 255;

  return { lastHarvestTime1: 0, user, publicKey, wallet, provider, userAccount1, bump1, rewardUserVault, rewardAmount }
})
users[1] = borrower1;
const [master, user1, user2, user3, user4] = users

const defaultAccounts = {
  tokenProgram: TOKEN_PROGRAM_ID,
  clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  systemProgram: SystemProgram.programId,
}
export default () => {
  describe('staking-common', () => {
    it('Is initialized!', async function () {
      rewardMint = new Token(provider.connection, UNLOC_MINT, TOKEN_PROGRAM_ID, superOwnerKeypair);
      lpMint = await createMint(provider, superOwnerKeypair.publicKey);
      [stateSigner, stateBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode('state')],
        program.programId
      );
      [extraRewardSigner, extraRewardBump] = await anchor.web3.PublicKey.findProgramAddress(
        [utf8.encode('extra')],
        program.programId
      );
      [poolSigner, poolBump] = await anchor.web3.PublicKey.findProgramAddress(
        [rewardMint.publicKey.toBuffer()],
        program.programId
      );
      [lpPoolSigner, lpPoolBump] = await anchor.web3.PublicKey.findProgramAddress(
        [lpMint.publicKey.toBuffer()],
        program.programId
      );
      poolVault = await rewardMint.createAccount(poolSigner)
      lpPoolVault = await lpMint.createAccount(lpPoolSigner)
    })
    it('Fund', async function () {
      await connection.confirmTransaction(await connection.requestAirdrop(lender1Keypair.publicKey, web3.LAMPORTS_PER_SOL))
      await Promise.all(users.map(async u => {
        await connection.confirmTransaction(await connection.requestAirdrop(u.publicKey, web3.LAMPORTS_PER_SOL))
        const stakeSeed = 10
        const [userAccount1, bump1] = await PublicKey.findProgramAddress([
          poolSigner.toBuffer(), u.publicKey.toBuffer(), new anchor.BN(stakeSeed).toBuffer('le', 1)
        ], program.programId)
        u.userAccount1 = userAccount1
        u.bump1 = bump1
        u.rewardUserVault = await getOrCreateAssociatedSPL(u.provider, rewardMint)
      }))
      await rewardMint.mintTo(user1.rewardUserVault, superOwnerKeypair, [superOwnerKeypair as any], 100)
      await rewardMint.mintTo(user2.rewardUserVault, superOwnerKeypair, [superOwnerKeypair as any], 400)
      await rewardMint.mintTo(user3.rewardUserVault, superOwnerKeypair, [superOwnerKeypair as any], 600)
      await rewardMint.mintTo(user4.rewardUserVault, superOwnerKeypair, [superOwnerKeypair as any], 800)
      await rewardMint.mintTo(master.rewardUserVault, superOwnerKeypair, [superOwnerKeypair as any], 10000)
    })
    it('Create State', async function () {
      const tokenPerSecond = 20;
      try {
        await createStakingState(
          connection, 
          superOwnerKeypair, 
          tokenPerSecond, 
          1000, 
          [new BN(0), new BN(100), new BN(500), new BN(1000), new BN(2000)], 
          rewardMint.publicKey.toBase58(),
          )
      }
      catch (e) {
        console.log(e);
      }
      const stateInfo = await program.account.stateAccount.fetch(stateSigner)
      assert.ok(stateInfo.tokenPerSecond.eq(new BN(tokenPerSecond)))
    })
    it('Create ExtraReward', async function () {
      await program.methods.createExtraRewardConfigs([
        { duration: new BN(0), extraPercentage: getNumber(0) },
      ])
        .accounts({
          state: stateSigner,
          extraRewardAccount: extraRewardSigner,
          authority: creatorKey,
          ...defaultAccounts
        })
        .signers([superOwnerKeypair])
        .rpc()

      await program.methods.setExtraRewardConfigs([
        { duration: new BN(0), extraPercentage: getNumber(0) },
        { duration: new BN(1), extraPercentage: getNumber(50) },
        { duration: new BN(86400), extraPercentage: getNumber(85) },
        { duration: new BN(5184000), extraPercentage: getNumber(100) },
      ])
        .accounts({
          extraRewardAccount: extraRewardSigner,
          authority: creatorKey,
          ...defaultAccounts
        })
        .signers([superOwnerKeypair])
        .rpc()

      const extraRewardConfigs = await program.account.extraRewardsAccount.fetch(extraRewardSigner)
      assert.ok((extraRewardConfigs.configs as any).length === 4)
      assert.ok(new BN(1).eq((extraRewardConfigs.configs as any)[1].duration))
      assert.ok(getNumber(50).eq((extraRewardConfigs.configs as any)[1].extraPercentage))
    })

    it('Create Pool', async function () {
      let pools = await program.account.farmPoolAccount.all()
      await program.methods.createPool(new BN('0'))
        .accounts({
          pool: poolSigner,
          state: stateSigner,
          mint: rewardMint.publicKey,
          vault: poolVault,
          authority: creatorKey,
          payer: creatorKey,
          ...defaultAccounts
        })
        .remainingAccounts(pools.map(p => ({
          pubkey: p.publicKey,
          isWritable: true,
          isSigner: false
        })))
        .signers([superOwnerKeypair])
        .rpc()

      pools = await program.account.farmPoolAccount.all()
      await program.methods.closePool()
        .accounts({
          pool: poolSigner,
          state: stateSigner,
          authority: creatorKey,
          ...defaultAccounts
        })
        .remainingAccounts(pools.map(p => ({
          pubkey: p.publicKey,
          isWritable: true,
          isSigner: false
        })))
        .signers([superOwnerKeypair])
        .rpc()

      pools = await program.account.farmPoolAccount.all()
      await program.methods.createPool(new BN('0'))
        .accounts({
          pool: poolSigner,
          state: stateSigner,
          mint: rewardMint.publicKey,
          vault: poolVault,
          authority: creatorKey,
          payer: creatorKey,
          ...defaultAccounts
        })
        .remainingAccounts(pools.map(p => ({
          pubkey: p.publicKey,
          isWritable: true,
          isSigner: false
        })))
        .signers([superOwnerKeypair])
        .rpc()

      let stateInfo = await program.account.stateAccount.fetch(stateSigner)
      let poolInfo = await program.account.farmPoolAccount.fetch(poolSigner)
      assert.ok(poolInfo.point.eq(stateInfo.totalPoint))
      assert.ok(poolInfo.point.eq(new BN('0')))
    })
    it('Fund to program', async function () {
      let stateInfo = await program.account.stateAccount.fetch(stateSigner)
      const tx = program.transaction.fundRewardToken(new BN(10000), {
        accounts: {
          state: stateSigner,
          rewardVault: stateInfo.rewardVault,
          userVault: master.rewardUserVault,
          authority: master.publicKey,
          ...defaultAccounts
        }
      })
      try {
        await master.provider.sendAndConfirm(tx, [], {})
      } catch(e){
        console.log(e)
      }
      // await master.provider.sendAndConfirm(tx, [], {})
    })
    
    it('changePoolPoint', async function () {
      let pools = await program.account.farmPoolAccount.all()
      await program.methods.changePoolPoint(new BN(1000))
        .accounts({
          pool: poolSigner,
          state: stateSigner,
          authority: creatorKey,
          ...defaultAccounts
        })
        .remainingAccounts(pools.map(p => ({
          pubkey: p.publicKey,
          isWritable: true,
          isSigner: false
        })))
        .signers([superOwnerKeypair])
        .rpc()

      let stateInfo = await program.account.stateAccount.fetch(stateSigner)
      let poolInfo = await program.account.farmPoolAccount.fetch(poolSigner)
      assert.ok(poolInfo.point.eq(stateInfo.totalPoint))
      assert.ok(poolInfo.point.eq(new BN(1000)))
    })
    it('Create user state accounts', async function () {
      for (let i = 0; i < users.length; i++) {
        const u = users[i];
        let userState = await PublicKey.findProgramAddress([
          new PublicKey(poolSigner).toBuffer(), u.user.publicKey.toBuffer()],
          program.programId
        )
        await program.methods.createUserState()
        .accounts({
          userState: userState[0],
          pool: poolSigner,
          authority: u.user.publicKey,
          payer: creatorKey,
          systemProgram: SystemProgram.programId
        })
        .signers([u.user, superOwnerKeypair])
        .rpc()
      } 
    })
    it('Create User with Invalid Seed', async function () {
      const u = users[0];
      await assertError(createStakingUser(u.provider.connection, u.provider.wallet, u.user, poolSigner.toBase58(), [u.user], 50), undefined)
    })
    it('Create User', async function () {
      console.log("Creating user stake accounts...")
      for (let i = 0; i < users.length; i++) {
        const u = users[i];
        await createStakingUser(u.provider.connection, u.provider.wallet, u.user, poolSigner.toBase58(), [u.user], 10);
      }
    })
    it('Create 2nd staking accounts for users w different seed', async function () {
      console.log("Creating 2nd user stake accounts...")
      for (let i = 0; i < users.length; i++) {
        const u = users[i];
        await createStakingUser(u.provider.connection, u.provider.wallet, u.user, poolSigner.toBase58(), [u.user], 11);
      }
    })
    it('Stake invalid lock duration', async function () {
      await assertError(stake(user1, new BN(100), 4), undefined)
    })
    it('Stake', async function () {
      await guardTime(2000, async () => {
        const user1StakeAmount = 100;
        const user2StakeAmount = 300;
        const user3StakeAmount = 600;
        await stake(user1, new BN(user1StakeAmount));
        await stake(user2, new BN(user2StakeAmount));
        await stake(user3, new BN(user3StakeAmount));
        const poolInfo = await program.account.farmPoolAccount.fetch(poolSigner)
        const poolVaultAmount = await getRewardTokenAmount(poolVault) as any
        assert.ok(poolVaultAmount.eq(poolInfo.amount))
        assert.ok(new BN(1000).eq(poolInfo.amount))

        const userInfo = await program.account.farmPoolUserAccount.fetch(user1.userAccount1)
        assert.ok(userInfo.amount.toNumber() === user1StakeAmount);
        assert.ok(userInfo.lockDuration.toNumber() === 0);
      })
    })

    it('Harvest', async function () {
      // 2s
      await guardTime(2000, async () => {
        const originAmount = await getRewardTokenAmount(user1.rewardUserVault);
        await unlocHarvest(user1);
        await unlocHarvest(user2);
        await unlocHarvest(user3);
        const currentAmount = await getRewardTokenAmount(user1.rewardUserVault);
        assert.ok(currentAmount.toString() > originAmount.toString())
      })
    })
    it('Unstake over amount', async function () {
      const tx = await unstake(user1, new BN(200))
      assert.ok(tx === null);
    })
    it('Unstake', async function () {
      // 4s
      await guardTime(2000, () => wrapError(async () => {
        await unstake(user3, new BN(600));
        const poolInfo = await program.account.farmPoolAccount.fetch(poolSigner)
        const poolVaultAmount = await getRewardTokenAmount(poolVault) as any
        assert.ok(poolVaultAmount.eq(poolInfo.amount))
        assert.ok(new BN(400).eq(poolInfo.amount))
      }))
    })
    it('ChangeTokenPerSecond', async function () {
      const pools = await program.account.farmPoolAccount.all()
      await Promise.all([
        unlocHarvest(user1),
        unlocHarvest(user2),
        changeStakingTokenPerSecond(connection, provider.wallet, pools, 40)
      ])
      const state = await program.account.stateAccount.fetch(stateSigner)
      const tokenPerSecond = state.tokenPerSecond.toNumber();
      assert.ok(tokenPerSecond === 40);
    })
    it('Create multiple staking accounts, for longer lock periods', async function () {
      const [userState, bump] = await PublicKey.findProgramAddress([
        new PublicKey(poolSigner).toBuffer(), user4.publicKey.toBuffer()
      ], program.programId)
  
      await guardTime(2000, async () => {
        let stakeAmount = 100;
        await stake(user4, new BN(stakeAmount), 86400, 1);
  
        const [userStakeAccount0, bump1] = await PublicKey.findProgramAddress([
          new PublicKey(poolSigner).toBuffer(), user4.publicKey.toBuffer(), new anchor.BN(1).toBuffer('le', 1)
        ], program.programId)
        let userInfo = await program.account.farmPoolUserAccount.fetch(userStakeAccount0)
        assert.ok(userInfo.amount.toNumber() === 100);
        assert.ok(userInfo.lockDuration.toNumber() === 86400);
        console.log("Unloc score: ", userInfo.unlocScore.toNumber())
  
        stakeAmount = 200;
        await stake(user4, new BN(stakeAmount), 86400, 2);
  
        const [userStakeAccount1, bump2] = await PublicKey.findProgramAddress([
          new PublicKey(poolSigner).toBuffer(), user4.publicKey.toBuffer(), new anchor.BN(2).toBuffer('le', 1)
        ], program.programId)
  
        userInfo = await program.account.farmPoolUserAccount.fetch(userStakeAccount1)
        assert.ok(userInfo.amount.toNumber() === 200);
        assert.ok(userInfo.lockDuration.toNumber() === 86400);
        console.log("Unloc score: ", userInfo.unlocScore.toNumber())
  
        stakeAmount = 300;
        await stake(user4, new BN(stakeAmount), 86400, 20);
  
        const [userStakeAccount2, bump3] = await PublicKey.findProgramAddress([
          new PublicKey(poolSigner).toBuffer(), user4.publicKey.toBuffer(), new anchor.BN(20).toBuffer('le', 1)
        ], program.programId)
        userInfo = await program.account.farmPoolUserAccount.fetch(userStakeAccount2)
        assert.ok(userInfo.amount.toNumber() === 300);
        assert.ok(userInfo.lockDuration.toNumber() === 86400);
        console.log("Unloc score: ", userInfo.unlocScore.toNumber())
      })
  
      const userStateInfo = await program.account.userStateAccount.fetch(userState)
      console.log("User total unloc score: ", userStateInfo.totalUnlocScore.toNumber())
      console.log("User's profile level: ", userStateInfo.profileLevel.toNumber())
    })
  
    it('Create staking account for lender and stake', async function () {
      // const globalState = await PublicKey.findProgramAddress([GLOBAL_STATE_TAG], loanProgram.programId)
      // const globalStateData = await loanProgram.account.globalState.fetch(globalState[0])
  
      const lenderStakingUser = await PublicKey.findProgramAddress(
        [poolSigner.toBuffer(), lender1Keypair.publicKey.toBuffer()],
        program.programId
      )
      try {
        console.log("Creating lender stake account")
        const createStateAcctTx = await program.methods.createUserState()
          .accounts({
            userState: lenderStakingUser[0],
            pool: poolSigner,
            authority: lender1Keypair.publicKey,
            payer: lender1Keypair.publicKey,
            systemProgram: SystemProgram.programId
          })
          .signers([lender1Keypair])
          .rpc()
          console.log('create lender user state tx = ', createStateAcctTx)
  
        console.log("Lender staking to raise their unloc level")
        const stateSigner = await getStakingStateAddress()
        const stakeAcct = await PublicKey.findProgramAddress(
          [poolSigner.toBuffer(), lender1Keypair.publicKey.toBuffer(),
          new anchor.BN(1).toBuffer('le', 1)],
          program.programId
        )
        const createStakeTx = await program.methods.createUser(1)
        .accounts({
          user: stakeAcct[0],
          userState: lenderStakingUser[0],
          state: stateSigner,
          pool: poolSigner,
          authority: lender1Keypair.publicKey,
          payer: lender1Keypair.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID
        })
        .signers([lender1Keypair])
        .rpc()
        console.log("Create lender staking account tx: ", createStakeTx)
  
        console.log("Lender staking tokens")
        const tx = new Transaction()
        const lenderTokenAcct = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, rewardMint.publicKey, lender1Keypair.publicKey)
        tx.add(Token.createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, rewardMint.publicKey, lenderTokenAcct, lender1Keypair.publicKey, lender1Keypair.publicKey))
        await provider.sendAndConfirm(tx, [lender1Keypair])
        await rewardMint.mintTo(lenderTokenAcct, superOwnerKeypair, [superOwnerKeypair as any], 100)
  
        const state = await getStakingState()
        const stakeTx = await program.methods.stake(new BN(100), new BN(5184000))
        .accounts({
          user: stakeAcct[0],
          userState: lenderStakingUser[0],
          state: stateSigner,
          pool: poolSigner,
          poolVault: poolVault.toBase58(),
          authority: lender1Keypair.publicKey,
          mint: rewardMint.publicKey,
          extraRewardAccount: extraRewardSigner,
          userVault: lenderTokenAcct,
          userVaultAuthority: lender1Keypair.publicKey,
          feeVault: state.feeVault,
          ...defaultAccounts
        })
        .signers([lender1Keypair])
        .rpc()
  
        console.log("Lender stake tx: ", stakeTx)
        
      } catch (e) {
        console.log(e)
      }
    })

  })
}
async function guardTime(time, fn) {
  let completed = false
  let tooShort = false
  await Promise.all([fn().then(() => completed = true), sleep(time).then(() => tooShort = !completed)])
  if (tooShort) console.error('SHORT')
}

async function assertUserReward(user, amount, showthrow = true) {
  const realAmount = await getRewardTokenAmount(user.rewardUserVault)
  user.rewardAmount = realAmount
  if (showthrow)
    assert.ok(new BN(amount.toString()).eq(realAmount), `Expected ${amount.toString()} but got ${realAmount.toString()}`)
}

async function unstake(u, amount) {
  const hash = await unlocUnstake(u.provider.connection, u.provider.wallet, u.user, poolSigner.toBase58(), rewardMint.publicKey.toBase58(), poolVault.toBase58(), u.rewardUserVault.toBase58(), amount, [u.user])
  return hash
}

async function unlocHarvest(u) {
  let stateInfo = await program.account.stateAccount.fetch(stateSigner)
  const hash = await harvest(u.provider.connection, u.provider.wallet, poolSigner.toBase58(), rewardMint.publicKey.toBase58(), u.rewardUserVault.toBase58(), stateInfo.rewardVault.toBase58(), [u.user]);
  return hash
}

async function stake(u, amount, lock = 0, stakeSeed = 10) {
  const hash = await unlocStake(u.provider.connection, u.provider.wallet, u.user, poolSigner.toBase58(), rewardMint.publicKey.toBase58(), poolVault.toBase58(), u.rewardUserVault.toBase58(), amount, lock, [u.user], stakeSeed)
  return hash
}
async function createMint(provider, authority, decimals = 9) {
  if (authority === undefined) {
    authority = superOwnerKeypair.publicKey;
  }
  const mint = await Token.createMint(
    provider.connection,
    superOwnerKeypair,
    authority,
    null,
    decimals,
    TOKEN_PROGRAM_ID
  );
  return mint;
}

function getNumber(num) {
  return new BN(num * 10 ** 9)
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getOrCreateAssociatedSPL(provider, mint) {
  const owner = provider.wallet.publicKey
  const ata = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint.publicKey, owner, true)
  try {
    const res = await (provider.connection as Connection).getAccountInfo(ata)
    if (!res) {
      const tx = new Transaction()
      tx.add(Token.createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint.publicKey, ata, owner, owner))
      await provider.sendAndConfirm(tx, [], {})
    }
  } catch (error) {
    const tx = new Transaction()
    tx.add(Token.createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint.publicKey, ata, owner, owner))
    await provider.sendAndConfirm(tx, [], {})
  }
  return ata
}

async function getRewardTokenAmount(account) {
  const tokenAcc = await rewardMint.getAccountInfo(account)
  const amount = tokenAcc.amount;
  return amount;
}