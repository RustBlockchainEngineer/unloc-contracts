export type UnlocBurn = {
  "version": "0.1.0",
  "name": "unloc_burn",
  "constants": [
    {
      "name": "GLOBAL_STATE_SEED",
      "type": {
        "defined": "&[u8]"
      },
      "value": "b\"GLOBAL_STATE_SEED\""
    },
    {
      "name": "UNLOC_VAULT_SEED",
      "type": {
        "defined": "&[u8]"
      },
      "value": "b\"UNLOC_VAULT_SEED\""
    },
    {
      "name": "WSOL_VAULT_SEED",
      "type": {
        "defined": "&[u8]"
      },
      "value": "b\"WSOL_VAULT_SEED\""
    },
    {
      "name": "USDC_VAULT_SEED",
      "type": {
        "defined": "&[u8]"
      },
      "value": "b\"USDC_VAULT_SEED\""
    }
  ],
  "instructions": [
    {
      "name": "createGlobalState",
      "accounts": [
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
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "unlocMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "unlocVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "usdcMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "usdcVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "wsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wsolVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ammProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "amm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "serumMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burnProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programData",
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
          "name": "newBurner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "updateGlobalState",
      "accounts": [
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
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ammProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "amm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "serumMarket",
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
        }
      ],
      "args": [
        {
          "name": "newAuthority",
          "type": "publicKey"
        },
        {
          "name": "newBurner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "buyback",
      "accounts": [
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "ammProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "amm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ammAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ammOpenOrders",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ammTargetOrders",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolCoinTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolPcTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "serumMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumBids",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumAsks",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumEventQueue",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumCoinVaultAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumPcVaultAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumVaultSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userSourceTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userDestinationTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "splTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "burn",
      "accounts": [
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "unlocMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "unlocVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "unlocVaultBump",
            "type": "u8"
          },
          {
            "name": "usdcVaultBump",
            "type": "u8"
          },
          {
            "name": "wsolVaultBump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "burner",
            "type": "publicKey"
          },
          {
            "name": "amm",
            "type": "publicKey"
          },
          {
            "name": "serumProgram",
            "type": "publicKey"
          },
          {
            "name": "serumMarket",
            "type": "publicKey"
          },
          {
            "name": "usdcVault",
            "type": "publicKey"
          },
          {
            "name": "unlocVault",
            "type": "publicKey"
          },
          {
            "name": "wsolVault",
            "type": "publicKey"
          }
        ]
      }
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
      "name": "InvalidMint",
      "msg": "InvalidMint"
    },
    {
      "code": 6010,
      "name": "InvalidAmount",
      "msg": "InvalidAmount"
    },
    {
      "code": 6011,
      "name": "InvalidDenominator",
      "msg": "InvalidDenominator"
    },
    {
      "code": 6012,
      "name": "InvalidProgramData",
      "msg": "The provided program data is incorrect."
    },
    {
      "code": 6013,
      "name": "InvalidProgramUpgradeAuthority",
      "msg": "The provided program upgrade authority is incorrect."
    },
    {
      "code": 6014,
      "name": "InvalidBurner",
      "msg": "InvalidBurner"
    },
    {
      "code": 6015,
      "name": "InvalidAmm",
      "msg": "InvalidAmm"
    },
    {
      "code": 6016,
      "name": "InvalidSerumProgram",
      "msg": "InvalidSerumProgram"
    },
    {
      "code": 6017,
      "name": "InvalidSerumMarket",
      "msg": "InvalidSerumMarket"
    },
    {
      "code": 6018,
      "name": "InvalidVault",
      "msg": "InvalidVault"
    }
  ]
};

export const IDL: UnlocBurn = {
  "version": "0.1.0",
  "name": "unloc_burn",
  "constants": [
    {
      "name": "GLOBAL_STATE_SEED",
      "type": {
        "defined": "&[u8]"
      },
      "value": "b\"GLOBAL_STATE_SEED\""
    },
    {
      "name": "UNLOC_VAULT_SEED",
      "type": {
        "defined": "&[u8]"
      },
      "value": "b\"UNLOC_VAULT_SEED\""
    },
    {
      "name": "WSOL_VAULT_SEED",
      "type": {
        "defined": "&[u8]"
      },
      "value": "b\"WSOL_VAULT_SEED\""
    },
    {
      "name": "USDC_VAULT_SEED",
      "type": {
        "defined": "&[u8]"
      },
      "value": "b\"USDC_VAULT_SEED\""
    }
  ],
  "instructions": [
    {
      "name": "createGlobalState",
      "accounts": [
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
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "unlocMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "unlocVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "usdcMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "usdcVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "wsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wsolVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ammProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "amm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "serumMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burnProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programData",
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
          "name": "newBurner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "updateGlobalState",
      "accounts": [
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
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ammProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "amm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "serumMarket",
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
        }
      ],
      "args": [
        {
          "name": "newAuthority",
          "type": "publicKey"
        },
        {
          "name": "newBurner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "buyback",
      "accounts": [
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "ammProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "amm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ammAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ammOpenOrders",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ammTargetOrders",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolCoinTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolPcTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "serumMarket",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumBids",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumAsks",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumEventQueue",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumCoinVaultAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumPcVaultAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "serumVaultSigner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userSourceTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userDestinationTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "splTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "burn",
      "accounts": [
        {
          "name": "globalState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "burner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "unlocMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "unlocVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "unlocVaultBump",
            "type": "u8"
          },
          {
            "name": "usdcVaultBump",
            "type": "u8"
          },
          {
            "name": "wsolVaultBump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "burner",
            "type": "publicKey"
          },
          {
            "name": "amm",
            "type": "publicKey"
          },
          {
            "name": "serumProgram",
            "type": "publicKey"
          },
          {
            "name": "serumMarket",
            "type": "publicKey"
          },
          {
            "name": "usdcVault",
            "type": "publicKey"
          },
          {
            "name": "unlocVault",
            "type": "publicKey"
          },
          {
            "name": "wsolVault",
            "type": "publicKey"
          }
        ]
      }
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
      "name": "InvalidMint",
      "msg": "InvalidMint"
    },
    {
      "code": 6010,
      "name": "InvalidAmount",
      "msg": "InvalidAmount"
    },
    {
      "code": 6011,
      "name": "InvalidDenominator",
      "msg": "InvalidDenominator"
    },
    {
      "code": 6012,
      "name": "InvalidProgramData",
      "msg": "The provided program data is incorrect."
    },
    {
      "code": 6013,
      "name": "InvalidProgramUpgradeAuthority",
      "msg": "The provided program upgrade authority is incorrect."
    },
    {
      "code": 6014,
      "name": "InvalidBurner",
      "msg": "InvalidBurner"
    },
    {
      "code": 6015,
      "name": "InvalidAmm",
      "msg": "InvalidAmm"
    },
    {
      "code": 6016,
      "name": "InvalidSerumProgram",
      "msg": "InvalidSerumProgram"
    },
    {
      "code": 6017,
      "name": "InvalidSerumMarket",
      "msg": "InvalidSerumMarket"
    },
    {
      "code": 6018,
      "name": "InvalidVault",
      "msg": "InvalidVault"
    }
  ]
};
