export type UnlocStaking = {
  "version": "0.1.0",
  "name": "unloc_staking",
  "instructions": [
    {
      "name": "createState",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
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
      "args": [
        {
          "name": "tokenPerSecond",
          "type": "u64"
        },
        {
          "name": "earlyUnlockFee",
          "type": "u64"
        },
        {
          "name": "profileLevels",
          "type": {
            "vec": "u128"
          }
        }
      ]
    },
    {
      "name": "createExtraRewardConfigs",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "extraRewardAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "configs",
          "type": {
            "vec": {
              "defined": "DurationExtraRewardConfig"
            }
          }
        }
      ]
    },
    {
      "name": "setExtraRewardConfigs",
      "accounts": [
        {
          "name": "extraRewardAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "configs",
          "type": {
            "vec": {
              "defined": "DurationExtraRewardConfig"
            }
          }
        }
      ]
    },
    {
      "name": "fundRewardToken",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
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
          "name": "userVault",
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
      "name": "changeTokensPerSecond",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenPerSecond",
          "type": "u64"
        }
      ]
    },
    {
      "name": "changeEarlyUnlockFee",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "earlyUnlockFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "changeProfileLevels",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "profileLevels",
          "type": {
            "vec": "u128"
          }
        }
      ]
    },
    {
      "name": "changeFeeVault",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "createPool",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
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
      "args": [
        {
          "name": "point",
          "type": "u64"
        },
        {
          "name": "amountMultipler",
          "type": "u64"
        }
      ]
    },
    {
      "name": "closePool",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
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
      "name": "changePoolAmountMultipler",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amountMultipler",
          "type": "u64"
        }
      ]
    },
    {
      "name": "changePoolPoint",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "point",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createUser",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
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
      "args": [
        {
          "name": "stakeSeed",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createUserState",
      "accounts": [
        {
          "name": "userState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "stake",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "extraRewardAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userVaultAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "feeVault",
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
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "lockDuration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "unstake",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "extraRewardAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userVaultAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "feeVault",
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
          "name": "clock",
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
      "name": "harvest",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "extraRewardAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userVault",
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
      "name": "extraRewardsAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "configs",
            "type": {
              "vec": {
                "defined": "DurationExtraRewardConfig"
              }
            }
          }
        ]
      }
    },
    {
      "name": "farmPoolAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "vault",
            "type": "publicKey"
          },
          {
            "name": "point",
            "type": "u64"
          },
          {
            "name": "lastRewardTime",
            "type": "i64"
          },
          {
            "name": "accRewardPerShare",
            "type": "u128"
          },
          {
            "name": "amountMultipler",
            "type": "u64"
          },
          {
            "name": "totalUser",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "stateAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "rewardMint",
            "type": "publicKey"
          },
          {
            "name": "rewardVault",
            "type": "publicKey"
          },
          {
            "name": "feeVault",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "totalPoint",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "tokenPerSecond",
            "type": "u64"
          },
          {
            "name": "earlyUnlockFee",
            "type": "u64"
          },
          {
            "name": "profileLevels",
            "type": {
              "vec": "u128"
            }
          },
          {
            "name": "stakeAcctSeeds",
            "type": {
              "array": [
                "u8",
                20
              ]
            }
          },
          {
            "name": "liquidityMiningStakeSeed",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "farmPoolUserAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "stakeSeed",
            "type": "u8"
          },
          {
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "rewardAmount",
            "type": "u128"
          },
          {
            "name": "extraReward",
            "type": "u128"
          },
          {
            "name": "rewardDebt",
            "type": "u128"
          },
          {
            "name": "lastStakeTime",
            "type": "i64"
          },
          {
            "name": "lockDuration",
            "type": "i64"
          },
          {
            "name": "unlocScore",
            "type": "u128"
          },
          {
            "name": "profileLevel",
            "type": "u64"
          },
          {
            "name": "reserved1",
            "type": "u128"
          },
          {
            "name": "reserved2",
            "type": "u128"
          },
          {
            "name": "reserved3",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "userStateAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "totalUnlocScore",
            "type": "u128"
          },
          {
            "name": "stakeAcctSeeds",
            "type": "bytes"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "unlocScores",
            "type": {
              "array": [
                "u128",
                21
              ]
            }
          },
          {
            "name": "profileLevel",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "DurationExtraRewardConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "duration",
            "type": "i64"
          },
          {
            "name": "extraPercentage",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "RateChanged",
      "fields": [
        {
          "name": "tokenPerSecond",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "EarlyUnlockFeeChanged",
      "fields": [
        {
          "name": "earlyUnlockFee",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "PoolCreated",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "mint",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "PoolLockDurationChanged",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "lockDuration",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "PoolAmountMultiplerChanged",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amountMultipler",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "PoolPointChanged",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "point",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "UserCreated",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "UserStaked",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "lockDuration",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "UserUnstaked",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "UserHarvested",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidOwner",
      "msg": "Invalid Owner"
    },
    {
      "code": 6001,
      "name": "UnstakeOverAmount",
      "msg": "Over staked amount"
    },
    {
      "code": 6002,
      "name": "UnderLocked",
      "msg": "Under locked"
    },
    {
      "code": 6003,
      "name": "WorkingPool",
      "msg": "Pool is working"
    },
    {
      "code": 6004,
      "name": "InvalidLockDuration",
      "msg": "Invalid Lock Duration"
    },
    {
      "code": 6005,
      "name": "InvalidSEQ",
      "msg": "Invalid SEQ"
    },
    {
      "code": 6006,
      "name": "InvalidDenominator",
      "msg": "InvalidDenominator"
    },
    {
      "code": 6007,
      "name": "OverflowMaxProfileLevel",
      "msg": "Overlfow Max Profile Level"
    },
    {
      "code": 6008,
      "name": "InvalidMint",
      "msg": "Wrong Mint"
    },
    {
      "code": 6009,
      "name": "MathOverflow",
      "msg": "Math operation overflow"
    },
    {
      "code": 6010,
      "name": "InvalidSeed",
      "msg": "Invalid seed for staking account"
    }
  ]
};

export const IDL: UnlocStaking = {
  "version": "0.1.0",
  "name": "unloc_staking",
  "instructions": [
    {
      "name": "createState",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
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
      "args": [
        {
          "name": "tokenPerSecond",
          "type": "u64"
        },
        {
          "name": "earlyUnlockFee",
          "type": "u64"
        },
        {
          "name": "profileLevels",
          "type": {
            "vec": "u128"
          }
        }
      ]
    },
    {
      "name": "createExtraRewardConfigs",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "extraRewardAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "configs",
          "type": {
            "vec": {
              "defined": "DurationExtraRewardConfig"
            }
          }
        }
      ]
    },
    {
      "name": "setExtraRewardConfigs",
      "accounts": [
        {
          "name": "extraRewardAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "configs",
          "type": {
            "vec": {
              "defined": "DurationExtraRewardConfig"
            }
          }
        }
      ]
    },
    {
      "name": "fundRewardToken",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
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
          "name": "userVault",
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
      "name": "changeTokensPerSecond",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenPerSecond",
          "type": "u64"
        }
      ]
    },
    {
      "name": "changeEarlyUnlockFee",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "earlyUnlockFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "changeProfileLevels",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "profileLevels",
          "type": {
            "vec": "u128"
          }
        }
      ]
    },
    {
      "name": "changeFeeVault",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "createPool",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
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
      "args": [
        {
          "name": "point",
          "type": "u64"
        },
        {
          "name": "amountMultipler",
          "type": "u64"
        }
      ]
    },
    {
      "name": "closePool",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
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
      "name": "changePoolAmountMultipler",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amountMultipler",
          "type": "u64"
        }
      ]
    },
    {
      "name": "changePoolPoint",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "point",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createUser",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
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
      "args": [
        {
          "name": "stakeSeed",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createUserState",
      "accounts": [
        {
          "name": "userState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "stake",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "extraRewardAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userVaultAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "feeVault",
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
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "lockDuration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "unstake",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "extraRewardAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "poolVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userVaultAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "feeVault",
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
          "name": "clock",
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
      "name": "harvest",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "extraRewardAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userVault",
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
      "name": "extraRewardsAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "configs",
            "type": {
              "vec": {
                "defined": "DurationExtraRewardConfig"
              }
            }
          }
        ]
      }
    },
    {
      "name": "farmPoolAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "vault",
            "type": "publicKey"
          },
          {
            "name": "point",
            "type": "u64"
          },
          {
            "name": "lastRewardTime",
            "type": "i64"
          },
          {
            "name": "accRewardPerShare",
            "type": "u128"
          },
          {
            "name": "amountMultipler",
            "type": "u64"
          },
          {
            "name": "totalUser",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "stateAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "rewardMint",
            "type": "publicKey"
          },
          {
            "name": "rewardVault",
            "type": "publicKey"
          },
          {
            "name": "feeVault",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "totalPoint",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "tokenPerSecond",
            "type": "u64"
          },
          {
            "name": "earlyUnlockFee",
            "type": "u64"
          },
          {
            "name": "profileLevels",
            "type": {
              "vec": "u128"
            }
          },
          {
            "name": "stakeAcctSeeds",
            "type": {
              "array": [
                "u8",
                20
              ]
            }
          },
          {
            "name": "liquidityMiningStakeSeed",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "farmPoolUserAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "stakeSeed",
            "type": "u8"
          },
          {
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "rewardAmount",
            "type": "u128"
          },
          {
            "name": "extraReward",
            "type": "u128"
          },
          {
            "name": "rewardDebt",
            "type": "u128"
          },
          {
            "name": "lastStakeTime",
            "type": "i64"
          },
          {
            "name": "lockDuration",
            "type": "i64"
          },
          {
            "name": "unlocScore",
            "type": "u128"
          },
          {
            "name": "profileLevel",
            "type": "u64"
          },
          {
            "name": "reserved1",
            "type": "u128"
          },
          {
            "name": "reserved2",
            "type": "u128"
          },
          {
            "name": "reserved3",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "userStateAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "totalUnlocScore",
            "type": "u128"
          },
          {
            "name": "stakeAcctSeeds",
            "type": "bytes"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "unlocScores",
            "type": {
              "array": [
                "u128",
                21
              ]
            }
          },
          {
            "name": "profileLevel",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "DurationExtraRewardConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "duration",
            "type": "i64"
          },
          {
            "name": "extraPercentage",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "RateChanged",
      "fields": [
        {
          "name": "tokenPerSecond",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "EarlyUnlockFeeChanged",
      "fields": [
        {
          "name": "earlyUnlockFee",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "PoolCreated",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "mint",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "PoolLockDurationChanged",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "lockDuration",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "PoolAmountMultiplerChanged",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amountMultipler",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "PoolPointChanged",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "point",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "UserCreated",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "UserStaked",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "lockDuration",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "UserUnstaked",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "UserHarvested",
      "fields": [
        {
          "name": "pool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidOwner",
      "msg": "Invalid Owner"
    },
    {
      "code": 6001,
      "name": "UnstakeOverAmount",
      "msg": "Over staked amount"
    },
    {
      "code": 6002,
      "name": "UnderLocked",
      "msg": "Under locked"
    },
    {
      "code": 6003,
      "name": "WorkingPool",
      "msg": "Pool is working"
    },
    {
      "code": 6004,
      "name": "InvalidLockDuration",
      "msg": "Invalid Lock Duration"
    },
    {
      "code": 6005,
      "name": "InvalidSEQ",
      "msg": "Invalid SEQ"
    },
    {
      "code": 6006,
      "name": "InvalidDenominator",
      "msg": "InvalidDenominator"
    },
    {
      "code": 6007,
      "name": "OverflowMaxProfileLevel",
      "msg": "Overlfow Max Profile Level"
    },
    {
      "code": 6008,
      "name": "InvalidMint",
      "msg": "Wrong Mint"
    },
    {
      "code": 6009,
      "name": "MathOverflow",
      "msg": "Math operation overflow"
    },
    {
      "code": 6010,
      "name": "InvalidSeed",
      "msg": "Invalid seed for staking account"
    }
  ]
};
