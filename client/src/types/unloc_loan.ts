export type UnlocLoan = {
  "version": "0.1.0",
  "name": "unloc_loan",
  "constants": [
    {
      "name": "GLOBAL_STATE_SEED",
      "type": "string",
      "value": "\"GLOBAL_STATE_SEED\""
    },
    {
      "name": "REWARD_VAULT_SEED",
      "type": "string",
      "value": "\"REWARD_VAULT_SEED\""
    },
    {
      "name": "OFFER_SEED",
      "type": "string",
      "value": "\"OFFER_SEED\""
    },
    {
      "name": "LENDER_REWARD_SEED",
      "type": "string",
      "value": "\"LENDER_REWARD_SEED\""
    },
    {
      "name": "SUB_OFFER_SEED",
      "type": "string",
      "value": "\"SUB_OFFER_SEED\""
    },
    {
      "name": "NFT_VAULT_SEED",
      "type": "string",
      "value": "\"NFT_VAULT_SEED\""
    },
    {
      "name": "OFFER_VAULT_SEED",
      "type": "string",
      "value": "\"OFFER_VAULT_SEED\""
    },
    {
      "name": "TREASURY_VAULT_SEED",
      "type": "string",
      "value": "\"TREASURY_VAULT_SEED\""
    },
    {
      "name": "SUB_OFFER_COUNT_PER_LEVEL",
      "type": "u64",
      "value": "5"
    },
    {
      "name": "DEFULT_SUB_OFFER_COUNT",
      "type": "u64",
      "value": "3"
    }
  ],
  "instructions": [
    {
      "name": "setGlobalState",
      "accounts": [
        {
          "name": "superOwner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newSuperOwner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWallet",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "accruedInterestNumerator",
          "type": "u64"
        },
        {
          "name": "denominator",
          "type": "u64"
        },
        {
          "name": "aprNumerator",
          "type": "u64"
        },
        {
          "name": "expireLoanDuration",
          "type": "u64"
        },
        {
          "name": "rewardPerSol",
          "type": "u64"
        },
        {
          "name": "rewardPerUsdc",
          "type": "u64"
        },
        {
          "name": "lenderRewardsPercentage",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setInternalInfo",
      "accounts": [
        {
          "name": "superOwner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "unlocStakingPid",
          "type": "publicKey"
        },
        {
          "name": "unlocStakingPoolId",
          "type": "publicKey"
        },
        {
          "name": "votingPid",
          "type": "publicKey"
        },
        {
          "name": "tokenMetadataPid",
          "type": "publicKey"
        },
        {
          "name": "currentVotingNum",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositRewards",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimRewards",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "setOffer",
      "accounts": [
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "setSubOfferByStaking",
      "accounts": [
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subOffer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingUser",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offerMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "offerAmount",
          "type": "u64"
        },
        {
          "name": "subOfferNumber",
          "type": "u64"
        },
        {
          "name": "loanDuration",
          "type": "u64"
        },
        {
          "name": "minRepaidNumerator",
          "type": "u64"
        },
        {
          "name": "aprNumerator",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setSubOffer",
      "accounts": [
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subOffer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offerMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "offerAmount",
          "type": "u64"
        },
        {
          "name": "subOfferNumber",
          "type": "u64"
        },
        {
          "name": "loanDuration",
          "type": "u64"
        },
        {
          "name": "minRepaidNumerator",
          "type": "u64"
        },
        {
          "name": "aprNumerator",
          "type": "u64"
        }
      ]
    },
    {
      "name": "cancelOffer",
      "accounts": [
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "cancelSubOffer",
      "accounts": [
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subOffer",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "acceptOfferByVoting",
      "accounts": [
        {
          "name": "lender",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "voting",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "votingItem",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subOffer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offerMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "borrowerOfferVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lenderOfferVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "acceptOffer",
      "accounts": [
        {
          "name": "lender",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subOffer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offerMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "borrowerOfferVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lenderOfferVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "repayLoan",
      "accounts": [
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "lender",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subOffer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "borrowerNftVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lenderOfferVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "borrowerOfferVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claimCollateral",
      "accounts": [
        {
          "name": "lender",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subOffer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lenderNftVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "borrowerNftVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lenderOfferVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claimExpiredCollateral",
      "accounts": [
        {
          "name": "superOwner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subOffer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNftVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "borrowerNftVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "globalState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superOwner",
            "type": "publicKey"
          },
          {
            "name": "treasuryWallet",
            "type": "publicKey"
          },
          {
            "name": "accruedInterestNumerator",
            "type": "u64"
          },
          {
            "name": "aprNumerator",
            "type": "u64"
          },
          {
            "name": "expireLoanDuration",
            "type": "u64"
          },
          {
            "name": "denominator",
            "type": "u64"
          },
          {
            "name": "rewardPerSol",
            "type": "u64"
          },
          {
            "name": "rewardPerUsdc",
            "type": "u64"
          },
          {
            "name": "lenderRewardsPercentage",
            "type": "u64"
          },
          {
            "name": "unlocStakingPid",
            "type": "publicKey"
          },
          {
            "name": "unlocStakingPoolId",
            "type": "publicKey"
          },
          {
            "name": "votingPid",
            "type": "publicKey"
          },
          {
            "name": "currentVotingNum",
            "type": "u64"
          },
          {
            "name": "tokenMetadataPid",
            "type": "publicKey"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u128",
                15
              ]
            }
          }
        ]
      }
    },
    {
      "name": "offer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "borrower",
            "type": "publicKey"
          },
          {
            "name": "nftMint",
            "type": "publicKey"
          },
          {
            "name": "collection",
            "type": "publicKey"
          },
          {
            "name": "state",
            "type": "u8"
          },
          {
            "name": "subOfferCount",
            "type": "u64"
          },
          {
            "name": "startSubOfferNum",
            "type": "u64"
          },
          {
            "name": "creationDate",
            "type": "u64"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u128",
                7
              ]
            }
          }
        ]
      }
    },
    {
      "name": "subOffer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "borrower",
            "type": "publicKey"
          },
          {
            "name": "nftMint",
            "type": "publicKey"
          },
          {
            "name": "offerMint",
            "type": "publicKey"
          },
          {
            "name": "state",
            "type": "u8"
          },
          {
            "name": "offer",
            "type": "publicKey"
          },
          {
            "name": "subOfferNumber",
            "type": "u64"
          },
          {
            "name": "lender",
            "type": "publicKey"
          },
          {
            "name": "offerVault",
            "type": "publicKey"
          },
          {
            "name": "offerAmount",
            "type": "u64"
          },
          {
            "name": "repaidAmount",
            "type": "u64"
          },
          {
            "name": "lenderClaimedAmount",
            "type": "u64"
          },
          {
            "name": "borrowerClaimedAmount",
            "type": "u64"
          },
          {
            "name": "loanStartedTime",
            "type": "u64"
          },
          {
            "name": "loanEndedTime",
            "type": "u64"
          },
          {
            "name": "loanDuration",
            "type": "u64"
          },
          {
            "name": "minRepaidNumerator",
            "type": "u64"
          },
          {
            "name": "aprNumerator",
            "type": "u64"
          },
          {
            "name": "creationDate",
            "type": "u64"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u128",
                7
              ]
            }
          }
        ]
      }
    },
    {
      "name": "lenderReward",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lender",
            "type": "publicKey"
          },
          {
            "name": "borrower",
            "type": "publicKey"
          },
          {
            "name": "collection",
            "type": "publicKey"
          },
          {
            "name": "totalPoint",
            "type": "u128"
          },
          {
            "name": "collectionPoint",
            "type": "u128"
          },
          {
            "name": "subOffer",
            "type": "publicKey"
          },
          {
            "name": "loanMint",
            "type": "publicKey"
          },
          {
            "name": "loanMintDecimals",
            "type": "u8"
          },
          {
            "name": "startTime",
            "type": "u64"
          },
          {
            "name": "endTime",
            "type": "u64"
          },
          {
            "name": "lenderLastClaimedTime",
            "type": "u64"
          },
          {
            "name": "borrowerLastClaimedTime",
            "type": "u64"
          },
          {
            "name": "maxDuration",
            "type": "u64"
          },
          {
            "name": "loanAmount",
            "type": "u64"
          },
          {
            "name": "lenderClaimedAmount",
            "type": "u64"
          },
          {
            "name": "borrowerClaimedAmount",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "OfferState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Proposed"
          },
          {
            "name": "Accepted"
          },
          {
            "name": "Expired"
          },
          {
            "name": "Fulfilled"
          },
          {
            "name": "NFTClaimed"
          },
          {
            "name": "Canceled"
          }
        ]
      }
    },
    {
      "name": "SubOfferState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Proposed"
          },
          {
            "name": "Accepted"
          },
          {
            "name": "Expired"
          },
          {
            "name": "Fulfilled"
          },
          {
            "name": "LoanPaymentClaimed"
          },
          {
            "name": "Canceled"
          },
          {
            "name": "NFTClaimed"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "OfferSet",
      "fields": []
    },
    {
      "name": "OfferAccepted",
      "fields": []
    },
    {
      "name": "OfferCanceled",
      "fields": []
    },
    {
      "name": "NFTClaimed",
      "fields": []
    },
    {
      "name": "LoanRepaid",
      "fields": []
    },
    {
      "name": "LoanClaimed",
      "fields": []
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "You are not authorized to perform this action."
    },
    {
      "code": 6001,
      "name": "AlreadyInUse",
      "msg": "AlreadyInUse"
    },
    {
      "code": 6002,
      "name": "InvalidProgramAddress",
      "msg": "InvalidProgramAddress"
    },
    {
      "code": 6003,
      "name": "InvalidState",
      "msg": "InvalidState"
    },
    {
      "code": 6004,
      "name": "InvalidOwner",
      "msg": "InvalidOwner"
    },
    {
      "code": 6005,
      "name": "NotAllowed",
      "msg": "NotAllowed"
    },
    {
      "code": 6006,
      "name": "MathOverflow",
      "msg": "Math operation overflow"
    },
    {
      "code": 6007,
      "name": "InvalidAccountInput",
      "msg": "InvalidAccountInput"
    },
    {
      "code": 6008,
      "name": "InvalidPubkey",
      "msg": "InvalidPubkey"
    },
    {
      "code": 6009,
      "name": "InvalidAmount",
      "msg": "InvalidAmount"
    },
    {
      "code": 6010,
      "name": "InvalidDenominator",
      "msg": "InvalidDenominator"
    }
  ]
};

export const IDL: UnlocLoan = {
  "version": "0.1.0",
  "name": "unloc_loan",
  "constants": [
    {
      "name": "GLOBAL_STATE_SEED",
      "type": "string",
      "value": "\"GLOBAL_STATE_SEED\""
    },
    {
      "name": "REWARD_VAULT_SEED",
      "type": "string",
      "value": "\"REWARD_VAULT_SEED\""
    },
    {
      "name": "OFFER_SEED",
      "type": "string",
      "value": "\"OFFER_SEED\""
    },
    {
      "name": "LENDER_REWARD_SEED",
      "type": "string",
      "value": "\"LENDER_REWARD_SEED\""
    },
    {
      "name": "SUB_OFFER_SEED",
      "type": "string",
      "value": "\"SUB_OFFER_SEED\""
    },
    {
      "name": "NFT_VAULT_SEED",
      "type": "string",
      "value": "\"NFT_VAULT_SEED\""
    },
    {
      "name": "OFFER_VAULT_SEED",
      "type": "string",
      "value": "\"OFFER_VAULT_SEED\""
    },
    {
      "name": "TREASURY_VAULT_SEED",
      "type": "string",
      "value": "\"TREASURY_VAULT_SEED\""
    },
    {
      "name": "SUB_OFFER_COUNT_PER_LEVEL",
      "type": "u64",
      "value": "5"
    },
    {
      "name": "DEFULT_SUB_OFFER_COUNT",
      "type": "u64",
      "value": "3"
    }
  ],
  "instructions": [
    {
      "name": "setGlobalState",
      "accounts": [
        {
          "name": "superOwner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newSuperOwner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWallet",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "accruedInterestNumerator",
          "type": "u64"
        },
        {
          "name": "denominator",
          "type": "u64"
        },
        {
          "name": "aprNumerator",
          "type": "u64"
        },
        {
          "name": "expireLoanDuration",
          "type": "u64"
        },
        {
          "name": "rewardPerSol",
          "type": "u64"
        },
        {
          "name": "rewardPerUsdc",
          "type": "u64"
        },
        {
          "name": "lenderRewardsPercentage",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setInternalInfo",
      "accounts": [
        {
          "name": "superOwner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "unlocStakingPid",
          "type": "publicKey"
        },
        {
          "name": "unlocStakingPoolId",
          "type": "publicKey"
        },
        {
          "name": "votingPid",
          "type": "publicKey"
        },
        {
          "name": "tokenMetadataPid",
          "type": "publicKey"
        },
        {
          "name": "currentVotingNum",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositRewards",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimRewards",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userRewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "setOffer",
      "accounts": [
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "setSubOfferByStaking",
      "accounts": [
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subOffer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingUser",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offerMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "offerAmount",
          "type": "u64"
        },
        {
          "name": "subOfferNumber",
          "type": "u64"
        },
        {
          "name": "loanDuration",
          "type": "u64"
        },
        {
          "name": "minRepaidNumerator",
          "type": "u64"
        },
        {
          "name": "aprNumerator",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setSubOffer",
      "accounts": [
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subOffer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offerMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "offerAmount",
          "type": "u64"
        },
        {
          "name": "subOfferNumber",
          "type": "u64"
        },
        {
          "name": "loanDuration",
          "type": "u64"
        },
        {
          "name": "minRepaidNumerator",
          "type": "u64"
        },
        {
          "name": "aprNumerator",
          "type": "u64"
        }
      ]
    },
    {
      "name": "cancelOffer",
      "accounts": [
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "cancelSubOffer",
      "accounts": [
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subOffer",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "acceptOfferByVoting",
      "accounts": [
        {
          "name": "lender",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "voting",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "votingItem",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subOffer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offerMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "borrowerOfferVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lenderOfferVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "acceptOffer",
      "accounts": [
        {
          "name": "lender",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subOffer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offerMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "borrowerOfferVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lenderOfferVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "repayLoan",
      "accounts": [
        {
          "name": "borrower",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "lender",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subOffer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userReward",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "borrowerNftVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lenderOfferVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "borrowerOfferVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claimCollateral",
      "accounts": [
        {
          "name": "lender",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subOffer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lenderNftVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "borrowerNftVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lenderOfferVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claimExpiredCollateral",
      "accounts": [
        {
          "name": "superOwner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasuryWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subOffer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNftVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "borrowerNftVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "globalState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superOwner",
            "type": "publicKey"
          },
          {
            "name": "treasuryWallet",
            "type": "publicKey"
          },
          {
            "name": "accruedInterestNumerator",
            "type": "u64"
          },
          {
            "name": "aprNumerator",
            "type": "u64"
          },
          {
            "name": "expireLoanDuration",
            "type": "u64"
          },
          {
            "name": "denominator",
            "type": "u64"
          },
          {
            "name": "rewardPerSol",
            "type": "u64"
          },
          {
            "name": "rewardPerUsdc",
            "type": "u64"
          },
          {
            "name": "lenderRewardsPercentage",
            "type": "u64"
          },
          {
            "name": "unlocStakingPid",
            "type": "publicKey"
          },
          {
            "name": "unlocStakingPoolId",
            "type": "publicKey"
          },
          {
            "name": "votingPid",
            "type": "publicKey"
          },
          {
            "name": "currentVotingNum",
            "type": "u64"
          },
          {
            "name": "tokenMetadataPid",
            "type": "publicKey"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u128",
                15
              ]
            }
          }
        ]
      }
    },
    {
      "name": "offer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "borrower",
            "type": "publicKey"
          },
          {
            "name": "nftMint",
            "type": "publicKey"
          },
          {
            "name": "collection",
            "type": "publicKey"
          },
          {
            "name": "state",
            "type": "u8"
          },
          {
            "name": "subOfferCount",
            "type": "u64"
          },
          {
            "name": "startSubOfferNum",
            "type": "u64"
          },
          {
            "name": "creationDate",
            "type": "u64"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u128",
                7
              ]
            }
          }
        ]
      }
    },
    {
      "name": "subOffer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "borrower",
            "type": "publicKey"
          },
          {
            "name": "nftMint",
            "type": "publicKey"
          },
          {
            "name": "offerMint",
            "type": "publicKey"
          },
          {
            "name": "state",
            "type": "u8"
          },
          {
            "name": "offer",
            "type": "publicKey"
          },
          {
            "name": "subOfferNumber",
            "type": "u64"
          },
          {
            "name": "lender",
            "type": "publicKey"
          },
          {
            "name": "offerVault",
            "type": "publicKey"
          },
          {
            "name": "offerAmount",
            "type": "u64"
          },
          {
            "name": "repaidAmount",
            "type": "u64"
          },
          {
            "name": "lenderClaimedAmount",
            "type": "u64"
          },
          {
            "name": "borrowerClaimedAmount",
            "type": "u64"
          },
          {
            "name": "loanStartedTime",
            "type": "u64"
          },
          {
            "name": "loanEndedTime",
            "type": "u64"
          },
          {
            "name": "loanDuration",
            "type": "u64"
          },
          {
            "name": "minRepaidNumerator",
            "type": "u64"
          },
          {
            "name": "aprNumerator",
            "type": "u64"
          },
          {
            "name": "creationDate",
            "type": "u64"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u128",
                7
              ]
            }
          }
        ]
      }
    },
    {
      "name": "lenderReward",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lender",
            "type": "publicKey"
          },
          {
            "name": "borrower",
            "type": "publicKey"
          },
          {
            "name": "collection",
            "type": "publicKey"
          },
          {
            "name": "totalPoint",
            "type": "u128"
          },
          {
            "name": "collectionPoint",
            "type": "u128"
          },
          {
            "name": "subOffer",
            "type": "publicKey"
          },
          {
            "name": "loanMint",
            "type": "publicKey"
          },
          {
            "name": "loanMintDecimals",
            "type": "u8"
          },
          {
            "name": "startTime",
            "type": "u64"
          },
          {
            "name": "endTime",
            "type": "u64"
          },
          {
            "name": "lenderLastClaimedTime",
            "type": "u64"
          },
          {
            "name": "borrowerLastClaimedTime",
            "type": "u64"
          },
          {
            "name": "maxDuration",
            "type": "u64"
          },
          {
            "name": "loanAmount",
            "type": "u64"
          },
          {
            "name": "lenderClaimedAmount",
            "type": "u64"
          },
          {
            "name": "borrowerClaimedAmount",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "OfferState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Proposed"
          },
          {
            "name": "Accepted"
          },
          {
            "name": "Expired"
          },
          {
            "name": "Fulfilled"
          },
          {
            "name": "NFTClaimed"
          },
          {
            "name": "Canceled"
          }
        ]
      }
    },
    {
      "name": "SubOfferState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Proposed"
          },
          {
            "name": "Accepted"
          },
          {
            "name": "Expired"
          },
          {
            "name": "Fulfilled"
          },
          {
            "name": "LoanPaymentClaimed"
          },
          {
            "name": "Canceled"
          },
          {
            "name": "NFTClaimed"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "OfferSet",
      "fields": []
    },
    {
      "name": "OfferAccepted",
      "fields": []
    },
    {
      "name": "OfferCanceled",
      "fields": []
    },
    {
      "name": "NFTClaimed",
      "fields": []
    },
    {
      "name": "LoanRepaid",
      "fields": []
    },
    {
      "name": "LoanClaimed",
      "fields": []
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "You are not authorized to perform this action."
    },
    {
      "code": 6001,
      "name": "AlreadyInUse",
      "msg": "AlreadyInUse"
    },
    {
      "code": 6002,
      "name": "InvalidProgramAddress",
      "msg": "InvalidProgramAddress"
    },
    {
      "code": 6003,
      "name": "InvalidState",
      "msg": "InvalidState"
    },
    {
      "code": 6004,
      "name": "InvalidOwner",
      "msg": "InvalidOwner"
    },
    {
      "code": 6005,
      "name": "NotAllowed",
      "msg": "NotAllowed"
    },
    {
      "code": 6006,
      "name": "MathOverflow",
      "msg": "Math operation overflow"
    },
    {
      "code": 6007,
      "name": "InvalidAccountInput",
      "msg": "InvalidAccountInput"
    },
    {
      "code": 6008,
      "name": "InvalidPubkey",
      "msg": "InvalidPubkey"
    },
    {
      "code": 6009,
      "name": "InvalidAmount",
      "msg": "InvalidAmount"
    },
    {
      "code": 6010,
      "name": "InvalidDenominator",
      "msg": "InvalidDenominator"
    }
  ]
};
