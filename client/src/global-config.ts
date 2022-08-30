import * as anchor from '@project-serum/anchor'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
const {PublicKey} = anchor.web3
export const config = {
  cluster: 0,
  endpoints: [
    'http://localhost:8899',
    'https://api.devnet.solana.com',
    'https://solana-api.projectserum.com',
  ],
  loanPids: [
    'TkpSRsB8yB2qRETXLuPxuZ6Fkg2vuJnmfsQiJLfVpmG',
    'TkpSRsB8yB2qRETXLuPxuZ6Fkg2vuJnmfsQiJLfVpmG',
    'TkpSRsB8yB2qRETXLuPxuZ6Fkg2vuJnmfsQiJLfVpmG',
  ],
  stakingPids: [
    'GMdNWaWuQQAMTFr1gWd5VeT6CLbwn6QwiTy3Ek8F6Xvr',
    'GMdNWaWuQQAMTFr1gWd5VeT6CLbwn6QwiTy3Ek8F6Xvr',
    'GMdNWaWuQQAMTFr1gWd5VeT6CLbwn6QwiTy3Ek8F6Xvr',
  ],
  votingPids: [
    '7ZQhqWKTKbZZxvRVDVBLTfZneKyTsEyUTQKwbraLyAP3',
    '7ZQhqWKTKbZZxvRVDVBLTfZneKyTsEyUTQKwbraLyAP3',
    '7ZQhqWKTKbZZxvRVDVBLTfZneKyTsEyUTQKwbraLyAP3',
  ],
  buybackPids: [
    '2v8ZEC4QzHVf9ogZBvwtgasJsiNJfR3EtKqgtH39bTsw',
    '2v8ZEC4QzHVf9ogZBvwtgasJsiNJfR3EtKqgtH39bTsw',
    '2v8ZEC4QzHVf9ogZBvwtgasJsiNJfR3EtKqgtH39bTsw',
  ],
  unlocMints: [
    'Bt8KVz26uLrXrMzRKaJgX9rYd2VcfBh8J67D4s3kRmut',
    '4MwL9T4Kjyq8KuVbJM5hpfQizTKFbZmg7aqBQP9zapBJ',
    '4MwL9T4Kjyq8KuVbJM5hpfQizTKFbZmg7aqBQP9zapBJ',
  ],
  usdcMints: [
    'GH1gUyAw7ems5MD46WGC9JPMHncLVBkHagpXgtYVUyPr',
    '4MwL9T4Kjyq8KuVbJM5hpfQizTKFbZmg7aqBQP9zapBJ',
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  ],
  chainlinkSolFeed: [
    'CcPVS9bqyXbD9cLnTbhhHazLsrua8QMFUHTutPtjyDzq',
    'HgTtcbcmp5BeThax5AU8vg4VwK79qAvAKKFMs8txMLW6',
    'CcPVS9bqyXbD9cLnTbhhHazLsrua8QMFUHTutPtjyDzq',
  ],
  chainlinkUSDCFeed: [
    '7CLo1BY41BHAVnEs57kzYMnWXyBJrVEBPpZyQyPo2p1G',
    '4NmRgDfAZrfBHQBuzstMP5Bu1pgBzVn8u1djSvNrNkrN',
    '7CLo1BY41BHAVnEs57kzYMnWXyBJrVEBPpZyQyPo2p1G',
  ]
}

export const NFT_LOAN_PID = new PublicKey(
  config.loanPids[config.cluster]
)
export const STAKING_PID = new PublicKey(
  config.stakingPids[config.cluster]
)
export const VOTING_PID = new PublicKey(
  config.votingPids[config.cluster]
)
export const BUYBACK_PID = new PublicKey(
  config.buybackPids[config.cluster]
)
export const TOKEN_META_PID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
export const RPC_ENDPOINT = config.endpoints[config.cluster]
export const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
export const UNLOC_MINT = new PublicKey(
  config.unlocMints[config.cluster]
)
export const USDC_MINT = new PublicKey(
  config.usdcMints[config.cluster]
)

const CHAINLINK_AGGREGATOR_PROGRAM_ID = new anchor.web3.PublicKey(
  "HEvSKofvBgfaexv23kMabbYqxasxU3mQ4ibBMEmJWHny"
);

export const CHAINLINK_SOL_FEED = new PublicKey(config.chainlinkSolFeed[config.cluster])
export const CHAINLINK_USDC_FEED = new PublicKey(config.chainlinkUSDCFeed[config.cluster])
export const CHAINLINK_PID = new PublicKey(CHAINLINK_AGGREGATOR_PROGRAM_ID)
export const chainlinkIds = {
  chainlinkProgram: CHAINLINK_PID,
  solFeed: CHAINLINK_SOL_FEED,
  usdcFeed: CHAINLINK_USDC_FEED
}
export const discriminatorLen = 8;
export const systemProgram = anchor.web3.SystemProgram.programId
export const tokenProgram = TOKEN_PROGRAM_ID
export const rent = anchor.web3.SYSVAR_RENT_PUBKEY
export const clock = anchor.web3.SYSVAR_CLOCK_PUBKEY
export const defaults = {
systemProgram,
tokenProgram,
rent,
clock
}