import * as anchor from '@project-serum/anchor'
import SUPER_OWNER_WALLET from '../../test-users/super_owner.json'
import TREASURY from '../../test-users/treasury.json'
import UNLOC_TOKEN_KEYPAIR from '../../keypairs/unloc-token.json'
import USDC_TOKEN_KEYPAIR from '../../keypairs/usdc-token.json'
import { UnlocLoan } from '../../../src/types/unloc_loan'
import { defaults } from '../../../src/global-config'
import { safeAirdrop, pda, createTokenMints } from './loan-utils'
import PROPOSER1_WALLET from '../../test-users/borrower1.json'
import LENDER from '../../test-users/lender1.json'
import { GLOBAL_STATE_TAG, REWARD_VAULT_TAG } from './const'
import { assert } from 'chai'


// fetch test keypairs
const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
const borrowerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(PROPOSER1_WALLET))
const unlocTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(UNLOC_TOKEN_KEYPAIR))
const usdcTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(USDC_TOKEN_KEYPAIR))
const treasuryKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(TREASURY))
const lenderKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(LENDER))


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
const aprNumerator = new anchor.BN(1 * denominator.toNumber() / 100) // 1%
const minRepaidNumerator = new anchor.BN(denominator.toNumber() / 2) // 0.5
const rewardRate = new anchor.BN(300)
const expireLoanDuration = new anchor.BN(90 * 24 * 3600)

/*
This runs once before the entire test suit to initialize the state.
This instruction initalizes the state of the GlobalState account.
*/
before(async () => {
    console.log("Running setup for test suite...")
    await safeAirdrop(provider.connection, superOwnerKeypair.publicKey)
    await safeAirdrop(provider.connection, borrowerKeypair.publicKey)
    await safeAirdrop(provider.connection, treasuryKeypair.publicKey)
    await safeAirdrop(provider.connection, lenderKeypair.publicKey)
    await createTokenMints(superOwnerKeypair, unlocTokenKeypair, usdcTokenKeypair)

    const globalState = await pda([GLOBAL_STATE_TAG], programId)
    const rewardVault = await pda([REWARD_VAULT_TAG], programId)
    try {
        const signers = [superOwnerKeypair]
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
        .signers(signers)
        .rpc()
        console.log("Global state initialized, ready for tests!")

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