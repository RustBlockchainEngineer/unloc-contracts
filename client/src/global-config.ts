import * as anchor from '@project-serum/anchor'
const {PublicKey} = anchor.web3
export const config = {
    cluster: 0,
    endpoints: [
      'http://localhost:8899',
      'https://api.devnet.solana.com',
      'https://solana-api.projectserum.com',
    ],
    loanPids: [
      '6oVXrGCdtnTUR6xCvn2Z3f2CYaiboAGar1DKxzeX8QYh',
      '4MwL9T4Kjyq8KuVbJM5hpfQizTKFbZmg7aqBQP9zapBJ',
      '4MwL9T4Kjyq8KuVbJM5hpfQizTKFbZmg7aqBQP9zapBJ',
    ],
    stakingPids: [
      'EmS3wD1UF9UhejugSrfUydMzWrCKBCxz4Dr1tBUsodfU',
      '4MwL9T4Kjyq8KuVbJM5hpfQizTKFbZmg7aqBQP9zapBJ',
      '4MwL9T4Kjyq8KuVbJM5hpfQizTKFbZmg7aqBQP9zapBJ',
    ],
    votingPids: [
      '6z6RuFauTG511XRakJnPhxUTCVPohv6oC69xieMdm4Z9',
      '4MwL9T4Kjyq8KuVbJM5hpfQizTKFbZmg7aqBQP9zapBJ',
      '4MwL9T4Kjyq8KuVbJM5hpfQizTKFbZmg7aqBQP9zapBJ',
    ],
    buybackPids: [
      '37TgoUgxSshhJmhNEAQMmAWF7XRhXEaY5HxcTZ6eYs6r',
      '4MwL9T4Kjyq8KuVbJM5hpfQizTKFbZmg7aqBQP9zapBJ',
      '4MwL9T4Kjyq8KuVbJM5hpfQizTKFbZmg7aqBQP9zapBJ',
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