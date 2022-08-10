
import { createVoting, getLastVoting, getLastVotingKey, getVoting, getVotingGlobalState, getVotingItem, getVotingItemKey, getVotingUser, initVotingProgram, setVoting, setVotingGlobalState, setVotingItem, vote } from '../src'
import * as anchor from '@project-serum/anchor';

import { assert} from 'chai'  
import { UnlocVoting } from '../dist/cjs/types/unloc_voting';

import SUPER_OWNER_WALLET from './test-users/super_owner.json'
import BORROWER1_KEYPAIR from './test-users/borrower1.json'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

describe('voting-common', () => {

  const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
  const borrower1Keypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(BORROWER1_KEYPAIR))

  // Configure the client to use the local cluster.
  const envProvider = anchor.AnchorProvider.env();
  const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
  anchor.setProvider(provider);


  const program = anchor.workspace.UnlocVoting as anchor.Program<UnlocVoting>;
  
  const programId = program.programId

  initVotingProgram((program.provider as any).wallet,program.provider.connection, programId)

  const systemProgram = anchor.web3.SystemProgram.programId
  const tokenProgram = TOKEN_PROGRAM_ID
  const rent = anchor.web3.SYSVAR_RENT_PUBKEY
  const clock = anchor.web3.SYSVAR_CLOCK_PUBKEY
  const defaults = {
    systemProgram,
    tokenProgram,
    rent,
    clock
  }
  
  
  const superOwner = superOwnerKeypair.publicKey;

  it('Is initialized!', async () => {
    await safeAirdrop(program.provider.connection, superOwner, 10)
  })
  
  it('Set global state', async () => {
    await setVotingGlobalState(
      superOwner
    )
    // assert
    const globalStateData = await getVotingGlobalState()
    assert.ok(globalStateData.superOwner.equals(superOwner))
  });

  it('Create voting', async () => {
    const signers = [superOwnerKeypair]
    const currentTimestamp = Date.now() / 1000
    const votingStartTimestamp = new anchor.BN(currentTimestamp)
    const votingEndTimestamp = new anchor.BN(currentTimestamp + 3600 * 24 * 2)
    await createVoting(
      votingStartTimestamp,
      votingEndTimestamp,
      superOwner,
      signers
    )
    
    await createVoting(
      votingStartTimestamp,
      votingEndTimestamp,
      superOwner,
      signers
    )

    const voting = await getLastVoting()
    assert.ok(voting.votingStartTimestamp.eq(votingStartTimestamp))
    assert.ok(voting.votingEndTimestamp.eq(votingEndTimestamp))
  });
  it('Set voting', async () => {
    const signers = [superOwnerKeypair]
    const currentTimestamp = Date.now() / 1000
    const votingStartTimestamp = new anchor.BN(currentTimestamp + 100)
    const votingEndTimestamp = new anchor.BN(currentTimestamp + 3600 * 24 * 1)
    const votingNum = new BN(0)
    await setVoting(
      votingNum,
      votingStartTimestamp,
      votingEndTimestamp,
      superOwner,
      signers
    )
    const voting = await getVoting(votingNum)
    assert.ok(voting.votingStartTimestamp.eq(votingStartTimestamp))
    assert.ok(voting.votingEndTimestamp.eq(votingEndTimestamp))
  });
  it('Set VotingItem', async () => {
    const signers = [superOwnerKeypair]
    const votingKey = await getLastVotingKey()
    const collectionKey = new PublicKey('2WSwz8ig54Umx6GoLBXdZMa5B3giqirzDU5JzyNEdypn')
    await setVotingItem(
      collectionKey,
      votingKey,
      superOwner,
      signers
    )
    const votingItemKey = await getVotingItemKey(collectionKey, votingKey)
    const votingItem = await getVotingItem(votingItemKey)
    assert.ok(votingItem.key.equals(collectionKey))
    assert.ok(votingItem.voting.equals(votingKey))
  });
  it('vote', async () => {
    const signers = [borrower1Keypair]
    const votingKey = await getLastVotingKey()
    const collectionKey = new PublicKey('2WSwz8ig54Umx6GoLBXdZMa5B3giqirzDU5JzyNEdypn')
    const votingItemKey = await getVotingItemKey(collectionKey, votingKey)
    await vote(
      votingItemKey,
      borrower1Keypair.publicKey,
      signers
    )
    
    const votingUser = await getVotingUser(votingKey, borrower1Keypair.publicKey, signers)
    assert.ok(votingUser.owner.equals(borrower1Keypair.publicKey))
    assert.ok(votingUser.voting.equals(votingKey))
    assert.ok(votingUser.votingItem.equals(votingItemKey))
  });
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

async function pda(seeds: (Buffer | Uint8Array)[], programId: anchor.web3.PublicKey) {
  const [pdaKey] = 
      await anchor.web3.PublicKey.findProgramAddress(
        seeds,
        programId,
      );
  return pdaKey
}
