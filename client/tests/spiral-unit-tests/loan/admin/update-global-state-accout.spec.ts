import * as anchor from '@project-serum/anchor'
import SUPER_OWNER_WALLET from '../../../test-users/super_owner.json'
import TREASURY from '../../../test-users/treasury.json'
import UNLOC_TOKEN_KEYPAIR from '../../../keypairs/unloc-token.json'
import { UnlocLoan } from '../../../../src/types/unloc_loan'
import { defaults } from '../../../../src/global-config'
import { safeAirdrop, pda } from '../../utils/loan-utils'
import { GLOBAL_STATE_TAG, REWARD_VAULT_TAG } from '../../utils/const'
import { assert, expect } from 'chai'
import { Keypair } from '@solana/web3.js'


// fetch test keypairs
const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
const unlocTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(UNLOC_TOKEN_KEYPAIR))
const treasuryKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(TREASURY))


// Configure the client to use the local cluster.
const envProvider = anchor.AnchorProvider.env()
const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
anchor.setProvider(provider)

const program = anchor.workspace.UnlocLoan as anchor.Program<UnlocLoan>
const programId = program.programId

// define constants
const denominator = new anchor.BN(10000)
const lenderRewardsPercentage = new anchor.BN(6000)
const accruedInterestNumerator = new anchor.BN(10000000)
// increasing APR
const aprNumerator = new anchor.BN(2 * denominator.toNumber() / 100) // 1%
const minRepaidNumerator = new anchor.BN(denominator.toNumber() / 2) // 0.5
// increasing reward rate
const rewardRate = new anchor.BN(500)
const expireLoanDuration = new anchor.BN(90 * 24 * 3600)

describe('set global state tests', async () => {
    const globalState = await pda([GLOBAL_STATE_TAG], programId)
    const rewardVault = await pda([REWARD_VAULT_TAG], programId)

    it('Update global state account', async () => {
        try {
            await program.methods.setGlobalState(accruedInterestNumerator, denominator, minRepaidNumerator, aprNumerator, expireLoanDuration, rewardRate, lenderRewardsPercentage)
            .accounts({
                superOwner: superOwnerKeypair.publicKey,
                payer: superOwnerKeypair.publicKey,
                globalState: globalState,
                rewardMint: unlocTokenKeypair.publicKey,
                rewardVault: rewardVault,
                newSuperOwner: superOwnerKeypair.publicKey,
                treasuryWallet: treasuryKeypair.publicKey,
                ...defaults
            })
            .signers([superOwnerKeypair])
            .rpc()

            // assertions
            let globalStateData = await program.account.globalState.fetch(globalState)
            assert.equal(globalStateData.superOwner.toBase58(), superOwnerKeypair.publicKey.toBase58())
            assert.equal(globalStateData.treasuryWallet.toBase58(), treasuryKeypair.publicKey.toBase58())
            assert.equal(globalStateData.rewardVault.toBase58(), rewardVault.toBase58())
            assert.equal(globalStateData.accruedInterestNumerator.toNumber(), accruedInterestNumerator.toNumber())
            assert.equal(globalStateData.denominator.toNumber(), denominator.toNumber())
            assert.equal(globalStateData.aprNumerator.toNumber(), aprNumerator.toNumber())
        } catch (e) {
            console.log("Caught error: ", e)
            assert.fail()
        }
    })
})