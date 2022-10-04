export type UnlocVoting = {
  "version": "0.1.0",
  "name": "unloc_voting",
  "constants": [
    {
      "name": "GLOBAL_STATE_TAG",
      "type": {
        "defined": "&[u8]"
      },
      "value": "b\"GLOBAL_STATE_TAG\""
    },
    {
      "name": "VOTING_TAG",
      "type": {
        "defined": "&[u8]"
      },
      "value": "b\"VOTING_TAG\""
    },
    {
      "name": "VOTING_ITEM_TAG",
      "type": {
        "defined": "&[u8]"
      },
      "value": "b\"VOTING_ITEM_TAG\""
    },
    {
      "name": "VOTING_USER_TAG",
      "type": {
        "defined": "&[u8]"
      },
      "value": "b\"VOTING_USER_TAG\""
    }
  ],
  "instructions": [
    {
      "name": "createGlobalState",
      "accounts": [
        {
          "name": "superOwner",
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
          "name": "votingProgram",
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
      "args": []
    },
    {
      "name": "updateGlobalState",
      "accounts": [
        {
          "name": "superOwner",
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
        }
      ],
      "args": [
        {
          "name": "newSuperOwner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "setVoting",
      "accounts": [
        {
          "name": "superOwner",
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
          "name": "voting",
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
          "name": "votingNumber",
          "type": "u64"
        },
        {
          "name": "votingStartTimestamp",
          "type": "u64"
        },
        {
          "name": "votingEndTimestamp",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setVotingItem",
      "accounts": [
        {
          "name": "superOwner",
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
          "name": "key",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "vote",
      "accounts": [
        {
          "name": "user",
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
          "name": "votingUser",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingUser",
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
      "args": []
    },
    {
      "name": "delVotingItem",
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
            "name": "superOwner",
            "type": "publicKey"
          },
          {
            "name": "votingCount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "voting",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "votingNumber",
            "type": "u64"
          },
          {
            "name": "votingStartTimestamp",
            "type": "u64"
          },
          {
            "name": "votingEndTimestamp",
            "type": "u64"
          },
          {
            "name": "totalScore",
            "type": "u128"
          },
          {
            "name": "totalItems",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "votingItem",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "key",
            "type": "publicKey"
          },
          {
            "name": "voting",
            "type": "publicKey"
          },
          {
            "name": "votingScore",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "votingUser",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "voting",
            "type": "publicKey"
          },
          {
            "name": "votingItem",
            "type": "publicKey"
          },
          {
            "name": "votingScore",
            "type": "u128"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "VotingCreated",
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
    },
    {
      "code": 6011,
      "name": "InvalidProgramData",
      "msg": "The provided program data is incorrect."
    },
    {
      "code": 6012,
      "name": "InvalidProgramUpgradeAuthority",
      "msg": "The provided program upgrade authority is incorrect."
    }
  ]
};

export const IDL: UnlocVoting = {
  "version": "0.1.0",
  "name": "unloc_voting",
  "constants": [
    {
      "name": "GLOBAL_STATE_TAG",
      "type": {
        "defined": "&[u8]"
      },
      "value": "b\"GLOBAL_STATE_TAG\""
    },
    {
      "name": "VOTING_TAG",
      "type": {
        "defined": "&[u8]"
      },
      "value": "b\"VOTING_TAG\""
    },
    {
      "name": "VOTING_ITEM_TAG",
      "type": {
        "defined": "&[u8]"
      },
      "value": "b\"VOTING_ITEM_TAG\""
    },
    {
      "name": "VOTING_USER_TAG",
      "type": {
        "defined": "&[u8]"
      },
      "value": "b\"VOTING_USER_TAG\""
    }
  ],
  "instructions": [
    {
      "name": "createGlobalState",
      "accounts": [
        {
          "name": "superOwner",
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
          "name": "votingProgram",
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
      "args": []
    },
    {
      "name": "updateGlobalState",
      "accounts": [
        {
          "name": "superOwner",
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
        }
      ],
      "args": [
        {
          "name": "newSuperOwner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "setVoting",
      "accounts": [
        {
          "name": "superOwner",
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
          "name": "voting",
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
          "name": "votingNumber",
          "type": "u64"
        },
        {
          "name": "votingStartTimestamp",
          "type": "u64"
        },
        {
          "name": "votingEndTimestamp",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setVotingItem",
      "accounts": [
        {
          "name": "superOwner",
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
          "name": "key",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "vote",
      "accounts": [
        {
          "name": "user",
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
          "name": "votingUser",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingUser",
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
      "args": []
    },
    {
      "name": "delVotingItem",
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
            "name": "superOwner",
            "type": "publicKey"
          },
          {
            "name": "votingCount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "voting",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "votingNumber",
            "type": "u64"
          },
          {
            "name": "votingStartTimestamp",
            "type": "u64"
          },
          {
            "name": "votingEndTimestamp",
            "type": "u64"
          },
          {
            "name": "totalScore",
            "type": "u128"
          },
          {
            "name": "totalItems",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "votingItem",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "key",
            "type": "publicKey"
          },
          {
            "name": "voting",
            "type": "publicKey"
          },
          {
            "name": "votingScore",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "votingUser",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "voting",
            "type": "publicKey"
          },
          {
            "name": "votingItem",
            "type": "publicKey"
          },
          {
            "name": "votingScore",
            "type": "u128"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "VotingCreated",
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
    },
    {
      "code": 6011,
      "name": "InvalidProgramData",
      "msg": "The provided program data is incorrect."
    },
    {
      "code": 6012,
      "name": "InvalidProgramUpgradeAuthority",
      "msg": "The provided program upgrade authority is incorrect."
    }
  ]
};
