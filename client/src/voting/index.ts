import * as anchor from "@project-serum/anchor";
import { BN } from "@project-serum/anchor";
import { defaults, STAKING_PID, VOTING_PID } from "./../global-config";
import { getFirstStakingPool } from "./../staking";
import { pda, SOLANA_CONNECTION } from "./../utils";

const { PublicKey } = anchor.web3;

import { UnlocVoting, IDL } from "../types/unloc_voting";

export const VOTING_GLOBAL_STATE_TAG = Buffer.from("GLOBAL_STATE_TAG");
export const VOTING_TAG = Buffer.from("VOTING_TAG");
export const VOTING_ITEM_TAG = Buffer.from("VOTING_ITEM_TAG");
export const VOTING_USER_TAG = Buffer.from("VOTING_USER_TAG");

export let votingProgram: anchor.Program<UnlocVoting> =
  null as unknown as anchor.Program<UnlocVoting>;
export let votingProgramProvider: anchor.AnchorProvider =
  null as unknown as anchor.AnchorProvider;
export let votingProgramId: anchor.web3.PublicKey =
  null as unknown as anchor.web3.PublicKey;

export const initVotingProgram = (
  wallet: any,
  connection: anchor.web3.Connection = SOLANA_CONNECTION,
  pid: anchor.web3.PublicKey = VOTING_PID
) => {
  if (votingProgram != null) {
    return;
  }
  votingProgramId = pid;
  const provider = new anchor.AnchorProvider(connection, wallet, {
    skipPreflight: true,
  });
  votingProgramProvider = provider;

  // Generate the program client from IDL.
  votingProgram = new (anchor as any).Program(
    IDL,
    votingProgramId,
    provider
  ) as anchor.Program<UnlocVoting>;
};

export const setVotingGlobalState = async (
  newSuperOwner: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = votingProgramProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const globalState = await pda([VOTING_GLOBAL_STATE_TAG], votingProgramId);
  const superOwner = signer;

  const tx = await votingProgram.methods.setGlobalState(newSuperOwner)
    .accounts({
      superOwner,
      globalState,
      ...defaults,
    })
    .signers(signers)
    .rpc()

  // eslint-disable-next-line no-console
  console.log("setGlobalState tx = ", tx);
};
export const getVotingKeyFromNum = async (votingNumber: anchor.BN) => {
  return await pda(
    [VOTING_TAG, votingNumber.toArrayLike(Buffer, "be", 8)],
    votingProgramId
  );
}
export const createVoting = async (
  votingStartTimestamp: BN,
  votingEndTimestamp: BN,
  signer: anchor.web3.PublicKey = votingProgramProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const globalState = await pda([VOTING_GLOBAL_STATE_TAG], votingProgramId);
  const globalStateData = await votingProgram.account.globalState.fetch(
    globalState
  );
  const votingNumber = globalStateData.votingCount;
  const voting = await pda(
    [VOTING_TAG, votingNumber.toArrayLike(Buffer, "be", 8)],
    votingProgramId
  );
  const superOwner = signer;

  const tx = await votingProgram.methods.setVoting(votingNumber, votingStartTimestamp, votingEndTimestamp)
    .accounts({
      superOwner,
      globalState,
      voting,
      ...defaults,
    })
    .signers(signers)
    .rpc()

  // eslint-disable-next-line no-console
  console.log("createVoting tx = ", tx);
};

export const setVoting = async (
  votingNumber: BN,
  votingStartTimestamp: BN,
  votingEndTimestamp: BN,
  signer: anchor.web3.PublicKey = votingProgramProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const globalState = await pda([VOTING_GLOBAL_STATE_TAG], votingProgramId);
  const voting = await pda(
    [VOTING_TAG, votingNumber.toArrayLike(Buffer, "be", 8)],
    votingProgramId
  );
  const superOwner = signer;

  const tx = await votingProgram.methods.setVoting(votingNumber, votingStartTimestamp, votingEndTimestamp)
    .accounts({
      superOwner,
      globalState,
      voting,
      ...defaults,
    })
    .signers(signers)
    .rpc()

  // eslint-disable-next-line no-console
  console.log("setVoting tx = ", tx);
};

export const setVotingItem = async (
  collectionKey: anchor.web3.PublicKey,
  voting: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = votingProgramProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const globalState = await pda([VOTING_GLOBAL_STATE_TAG], votingProgramId);
  const superOwner = signer;
  const votingItem = await pda(
    [VOTING_ITEM_TAG, voting.toBuffer(), collectionKey.toBuffer()],
    votingProgramId
  );
  try {
    const tx = await votingProgram.methods.setVotingItem(collectionKey)
      .accounts({
        superOwner,
        globalState,
        voting,
        votingItem,
        ...defaults,
      })
      .signers(signers)
      .rpc()

    // eslint-disable-next-line no-console
    console.log("setVotingItem tx = ", tx);
  } catch (e) {
    console.log(e);
  }

};

export const delVotingItem = async (
  votingItem: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = votingProgramProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const globalState = await pda([VOTING_GLOBAL_STATE_TAG], votingProgramId);
  const superOwner = signer;
  const votingItemData = await votingProgram.account.votingItem.fetch(
    votingItem
  );
  const voting = votingItemData.voting;

  const tx = await votingProgram.methods.delVotingItem()
    .accounts({
      superOwner,
      globalState,
      voting,
      votingItem,
      ...defaults,
    })
    .signers(signers)
    .rpc()

  // eslint-disable-next-line no-console
  console.log("delVotingItem tx = ", tx);
};

export const vote = async (
  votingItem: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = votingProgramProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const globalState = await pda([VOTING_GLOBAL_STATE_TAG], votingProgramId);
  const user = signer;
  const votingItemData = await votingProgram.account.votingItem.fetch(
    votingItem
  );
  const voting = votingItemData.voting;
  const votingUser = await pda(
    [VOTING_USER_TAG, voting.toBuffer(), user.toBuffer()],
    votingProgramId
  );
  const stakingPool = (await getFirstStakingPool()).publicKey;
  const stakingUser = await pda(
    [stakingPool.toBuffer(), user.toBuffer()],
    STAKING_PID
  );
  try {
    const tx = await votingProgram.methods.vote()
      .accounts({
        user,
        globalState,
        voting,
        votingItem,
        votingUser,
        stakingUser,
        ...defaults,
      })
      .signers(signers)
      .rpc()

    // eslint-disable-next-line no-console
    console.log("vote tx = ", tx);
  } catch (e) {
    console.log(e);
  }
};


export const getVotingGlobalState = async () => {
  const globalState = await pda([VOTING_GLOBAL_STATE_TAG], votingProgramId);

  return await votingProgram.account.globalState.fetch(globalState)
};

export const getVoting = async (
  votingNumber: BN
) => {
  const voting = await pda(
    [VOTING_TAG, votingNumber.toArrayLike(Buffer, "be", 8)],
    votingProgramId
  );
  return await votingProgram.account.voting.fetch(voting)
};

export const getLastVoting = async () => {
  const globalState = await pda([VOTING_GLOBAL_STATE_TAG], votingProgramId);
  const globalStateData = await votingProgram.account.globalState.fetch(
    globalState
  );
  const votingNumber = new BN(globalStateData.votingCount.toNumber() - 1);
  const voting = await pda(
    [VOTING_TAG, votingNumber.toArrayLike(Buffer, "be", 8)],
    votingProgramId
  );
  return await votingProgram.account.voting.fetch(voting)
};

export const getLastVotingKey = async () => {
  const globalState = await pda([VOTING_GLOBAL_STATE_TAG], votingProgramId);
  const globalStateData = await votingProgram.account.globalState.fetch(
    globalState
  );
  const votingNumber = new BN(globalStateData.votingCount.toNumber() - 1);
  const voting = await pda(
    [VOTING_TAG, votingNumber.toArrayLike(Buffer, "be", 8)],
    votingProgramId
  );
  return voting
};

export const getVotingItem = async (votingItem: anchor.web3.PublicKey) => {
  return await votingProgram.account.votingItem.fetch(votingItem)
};

export const getAllVotingItems = async () => {
  return await votingProgram.account.votingItem.all()
};

export const getVotingItemKey = async (
  collectionKey: anchor.web3.PublicKey,
  voting: anchor.web3.PublicKey,
) => {
  const votingItem = await pda(
    [VOTING_ITEM_TAG, voting.toBuffer(), collectionKey.toBuffer()],
    votingProgramId
  );
  return votingItem
};

export const getVotingUser = async (
  voting: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = votingProgramProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const user = signer;
  const votingUser = await pda(
    [VOTING_USER_TAG, voting.toBuffer(), user.toBuffer()],
    votingProgramId
  );
  return await votingProgram.account.votingUser.fetch(votingUser)
};

export const getVotingUserKey = async (
  voting: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = votingProgramProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const user = signer;
  const votingUser = await pda(
    [VOTING_USER_TAG, voting.toBuffer(), user.toBuffer()],
    votingProgramId
  );
  return votingUser
};
