
import { burn, buyback, getBuybackGlobalState, getUnlocVaultKey, getUsdcVaultKey, initBuybackProgram, setBuybackGlobalState } from '../../src'
import * as anchor from '@project-serum/anchor';

import { assert } from 'chai'
import { UnlocBurn } from '../../src/types/unloc_burn';

import SUPER_OWNER_WALLET from '../test-users/super_owner.json'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@project-serum/anchor';
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js';
import UNLOC_TOKEN_KEYPAIR from '../keypairs/unloc-token.json'
import USDC_TOKEN_KEYPAIR from '../keypairs/usdc-token.json'
import { createAssociatedTokenAccountIfNotExist, createSerumMarket, getAssociatedPoolKeys, getMarket, getMintDecimals } from '../../src';
import { Liquidity, SERUM_PROGRAM_ID_V3, Spl, SPL_ACCOUNT_LAYOUT, WSOL } from '@unloc-dev/raydium-sdk';
import { AmmProxy, IDL as AMM_IDL } from '../amm_proxy_type'
import { closeAccount, initializeAccount } from '@project-serum/serum/lib/token-instructions';
import BigNumber from 'bignumber.js';
import { AnchorProvider } from '@project-serum/anchor';
describe('buyback-common', () => {

    const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))

    // Configure the client to use the local cluster.
    const envProvider = anchor.AnchorProvider.env();
    const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
    anchor.setProvider(provider);

    const program = anchor.workspace.UnlocBurn as anchor.Program<UnlocBurn>;

    const programId = program.programId

    initBuybackProgram((program.provider as any).wallet, program.provider.connection, programId)

    const ammProxyPid = new PublicKey('BUv45aNgrs7LeGTs69junTor4JfMFkBU8FX6urtG6rpr')
    const ammProxyProgram = new (anchor as any).Program(
        AMM_IDL,
        ammProxyPid,
        program.provider
    ) as anchor.Program<AmmProxy>;

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
    const unlocUsdcMarketKeypair = Keypair.generate()
    const unlocUsdcMarket = unlocUsdcMarketKeypair.publicKey

    const unlocTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(UNLOC_TOKEN_KEYPAIR))
    const usdcTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(USDC_TOKEN_KEYPAIR))
    const unlocToken = new Token(program.provider.connection, unlocTokenKeypair.publicKey, TOKEN_PROGRAM_ID, superOwnerKeypair);
    const usdcToken = new Token(program.provider.connection, usdcTokenKeypair.publicKey, TOKEN_PROGRAM_ID, superOwnerKeypair);

    let market: any = null;
    let poolKeys: any = null;
    it('Is initialized!', async () => {
        await safeAirdrop(program.provider.connection, superOwner, 100)
        const createMarketInfo = await createSerumMarket({
            connection: program.provider.connection,
            wallet: (program.provider as any).wallet,
            baseMint: usdcTokenKeypair.publicKey,
            quoteMint: unlocTokenKeypair.publicKey,
            baseLotSize: 1,
            quoteLotSize: 1,
            dexProgram: SERUM_PROGRAM_ID_V3,
            market: unlocUsdcMarketKeypair,
        })
        console.log("finished createSerumMarket")
        market = await getMarket(program.provider.connection, unlocUsdcMarket.toBase58(), SERUM_PROGRAM_ID_V3.toBase58())

        poolKeys = await getAssociatedPoolKeys({
            programId: Liquidity.getProgramId(4),
            serumProgramId: SERUM_PROGRAM_ID_V3,
            marketId: market.address,
            baseMint: market.baseMintAddress,
            quoteMint: market.quoteMintAddress
        })

        const transaction = new Transaction();
        const userCoinTokenAccount = await createAssociatedTokenAccountIfNotExist(
            (program.provider as any).wallet.publicKey,
            market.baseMintAddress,
            transaction,
            (program.provider as any).connection
        )
        const userPcTokenAccount = await createAssociatedTokenAccountIfNotExist(
            (program.provider as any).wallet.publicKey,
            market.quoteMintAddress,
            transaction,
            (program.provider as any).connection
        )

        if (transaction.instructions.length > 0) {
            const txid = await (program.provider as AnchorProvider).sendAndConfirm(transaction, [], {
                skipPreflight: true,
                preflightCommitment: "confirmed"
            })
            console.log("create user token accounts txid:", txid)
            console.log("baseMintAddress:", market.baseMintAddress.toString())
            console.log("quoteMintAddress:", market.quoteMintAddress.toString())
            console.log("userCoinTokenAccount:", userCoinTokenAccount.toString())
            console.log("userPcTokenAccount:", userPcTokenAccount.toString())
        }

        await usdcToken.mintTo(
            userCoinTokenAccount,
            superOwner,
            [],
            100000 * 10 ** 6, //100000
        );

        await unlocToken.mintTo(
            userPcTokenAccount,
            superOwner,
            [],
            100000 * 10 ** 6, //100000
        );

        const ammAuthority = poolKeys.authority
        const nonce = new anchor.BN(poolKeys.nonce)
        const ammId: PublicKey = poolKeys.id
        const poolCoinTokenAccount: PublicKey = poolKeys.baseVault
        const poolPcTokenAccount: PublicKey = poolKeys.quoteVault
        const lpMintAddress: PublicKey = poolKeys.lpMint
        const poolTempLpTokenAccount: PublicKey = poolKeys.lpVault
        const ammTargetOrders: PublicKey = poolKeys.targetOrders
        const poolWithdrawQueue: PublicKey = poolKeys.withdrawQueue
        const ammOpenOrders: PublicKey = poolKeys.openOrders

        const proxyPreInitializeTx = await ammProxyProgram.methods.proxyPreInitialize(nonce.toNumber())
            .accounts({
                ammProgram: Liquidity.getProgramId(4),
                ammTargetOrders: ammTargetOrders,
                poolWithdrawQueue: poolWithdrawQueue,
                ammAuthority: ammAuthority,
                lpMint: lpMintAddress,
                coinMint: market.baseMintAddress,
                pcMint: market.quoteMintAddress,
                poolCoinTokenAccount: poolCoinTokenAccount,
                poolPcTokenAccount: poolPcTokenAccount,
                poolTempLpTokenAccount: poolTempLpTokenAccount,
                serumMarket: market.address,
                userWallet: superOwner,
                splTokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
            })
            .rpc()

        console.log("proxyPreInitialize txid: ", proxyPreInitializeTx)

        // set as you want
        const userInputBaseValue = 1
        const userInputQuoteValue = 2

        await initAmm(
            program.provider.connection,
            program.provider,
            market,
            userInputBaseValue,
            userInputQuoteValue,
            poolCoinTokenAccount,
            poolPcTokenAccount,
            lpMintAddress,
            userCoinTokenAccount.toString(),
            userPcTokenAccount.toString(),
        )
        console.log("finished initAmm")
        // belongs to owner who create the pool
        const userLpTokenAccountPubKey = await Spl.getAssociatedTokenAccount({ mint: lpMintAddress, owner: superOwner })
        const proxyInitializeTx = await ammProxyProgram.methods.proxyInitialize(nonce, new anchor.BN(0))
            .accounts({
                ammProgram: Liquidity.getProgramId(4),
                amm: ammId,
                ammAuthority: ammAuthority,
                ammOpenOrders: ammOpenOrders,
                lpMint: lpMintAddress,
                coinMint: market.baseMintAddress,
                pcMint: market.quoteMintAddress,
                poolCoinTokenAccount: poolCoinTokenAccount,
                poolPcTokenAccount: poolPcTokenAccount,
                poolWithdrawQueue: poolWithdrawQueue,
                poolTargetOrdersAccount: ammTargetOrders,
                poolLpTokenAccount: userLpTokenAccountPubKey,
                poolTempLpTokenAccount: poolTempLpTokenAccount,
                serumProgram: SERUM_PROGRAM_ID_V3,
                serumMarket: market.address,
                userWallet: superOwner,
                splTokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
            })
            .rpc()

        console.log("proxyInitializeTx txid:", proxyInitializeTx)


        const transaction2 = new Transaction();
        const userLPTokenAccount: PublicKey = await createAssociatedTokenAccountIfNotExist(
            (program.provider as any).wallet.publicKey,
            poolKeys.lpMint,
            transaction2,
            (program.provider as any).connection
        )

        if (transaction2.instructions.length > 0) {
            const txid = await (program.provider as AnchorProvider).sendAndConfirm(transaction2, [], {
                skipPreflight: true,
                preflightCommitment: "confirmed"
            })
            console.log("create user lp token accounts txid:", txid)
        }
        console.log("depositing ...")
        try {
            const depositTx =
                await ammProxyProgram.methods.proxyDeposit(
                    new anchor.BN(10000 * 10 ** 6), // maxCoinAmount
                    new anchor.BN(20000 * 10 ** 6), // maxPcAmount
                    new anchor.BN(1) // baseSide?
                ).accounts({
                    ammProgram: Liquidity.getProgramId(4),
                    amm: poolKeys.id,
                    ammAuthority: poolKeys.authority,
                    ammOpenOrders: poolKeys.openOrders,
                    ammTargetOrders: poolKeys.targetOrders,
                    lpMint: poolKeys.lpMint,
                    poolCoinTokenAccount: poolKeys.baseVault,
                    poolPcTokenAccount: poolKeys.quoteVault,
                    serumMarket: market.address,
                    userCoinTokenAccount: userCoinTokenAccount,
                    userPcTokenAccount: userPcTokenAccount,
                    userLpTokenAccount: userLPTokenAccount,
                    userOwner: superOwner,
                    splTokenProgram: TOKEN_PROGRAM_ID,
                })
                    .rpc()

            console.log("proxyDeposit txid:", depositTx)
        } catch (e) {
            console.log(e)
        }
    })

    it('Set global state', async () => {
        try {
            await setBuybackGlobalState(superOwner, poolKeys.id, market.address)
        } catch (e) {
            console.log(e)
            assert.fail('error while set global state');
        }
    });
    it('fee collection', async () => {
        const usdcVaultKey = await getUsdcVaultKey()
        const unlocVaultKey = await getUnlocVaultKey()
        await usdcToken.mintTo(
            usdcVaultKey,
            superOwner,
            [],
            1000 * 10 ** 6, //100000
        );

        await unlocToken.mintTo(
            unlocVaultKey,
            superOwner,
            [],
            1000 * 10 ** 6, //100000
        );
    });
    it('buyback', async () => {
        try {
            await buyback()
            const usdcVaultKey = await getUsdcVaultKey()
            const usdcVaultAccount = await usdcToken.getAccountInfo(usdcVaultKey)
            const remainedAmount = new BN(usdcVaultAccount.amount).toNumber()
            assert.ok(remainedAmount === 0, 'not full buybacked. remained amount = ' + remainedAmount)
        } catch (e) {
            console.log(e)
            assert.fail('error while buyback');
        }

    });
    it('burn', async () => {
        try {
            await burn()
            const unlocVaultKey = await getUnlocVaultKey()
            const unlocVaultAccount = await unlocToken.getAccountInfo(unlocVaultKey)
            const remainedAmount = new BN(unlocVaultAccount.amount).toNumber()
            assert.ok(remainedAmount === 0, 'not full burned. remained amount = ' + remainedAmount)
        } catch (e) {
            console.log(e)
            assert.fail('error while burn');
        }
    });
});

async function safeAirdrop(connection: anchor.web3.Connection, key: anchor.web3.PublicKey, amount: number) {
    while (await connection.getBalance(key) < amount * 1000000000) {
        try {
            await connection.confirmTransaction(
                await connection.requestAirdrop(key, 1000000000),
                "confirmed"
            );
        } catch { }
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
async function initAmm(
    conn: any,
    provider: anchor.Provider,
    market: any,
    userInputBaseValue: number,
    userInputQuoteValue: number,
    poolCoinTokenAccount: PublicKey,
    poolPcTokenAccount: PublicKey,
    lpMintAddress: PublicKey,
    baseToken: string,
    quoteToken: string,
) {
    const baseMintDecimals = new BigNumber(await getMintDecimals(conn, market.baseMintAddress as PublicKey))
    const quoteMintDecimals = new BigNumber(await getMintDecimals(conn, market.quoteMintAddress as PublicKey))
    const coinVol = new BigNumber(10).exponentiatedBy(baseMintDecimals).multipliedBy(userInputBaseValue)
    const pcVol = new BigNumber(10).exponentiatedBy(quoteMintDecimals).multipliedBy(userInputQuoteValue)
    const transaction = new Transaction()
    const signers: any = []
    const owner = (provider as any).wallet.publicKey

    const destLpToken: PublicKey = await createAssociatedTokenAccountIfNotExist(
        owner,
        lpMintAddress,
        transaction,
        conn
    )

    if (market.baseMintAddress.toString() === WSOL.mint) {
        const newAccount = new Keypair()
        transaction.add(
            SystemProgram.createAccount({
                fromPubkey: owner,
                newAccountPubkey: newAccount.publicKey,
                lamports: parseInt(coinVol.toFixed()) + 1e7,
                space: SPL_ACCOUNT_LAYOUT.span,
                programId: TOKEN_PROGRAM_ID
            })
        )
        transaction.add(
            initializeAccount({
                account: newAccount.publicKey,
                mint: new PublicKey(WSOL.mint),
                owner
            })
        )

        transaction.add(Spl.makeTransferInstruction({
            source: newAccount.publicKey,
            destination: poolCoinTokenAccount,
            owner: owner,
            amount: parseInt(coinVol.toFixed())
        }))

        transaction.add(
            closeAccount({
                source: newAccount.publicKey,
                destination: owner,
                owner
            })
        )

        signers.push(newAccount)
    } else {
        transaction.add(
            Spl.makeTransferInstruction({
                source: new PublicKey(baseToken),
                destination: poolCoinTokenAccount,
                owner: owner,
                amount: parseInt(coinVol.toFixed())
            })
        )
    }
    if (market.quoteMintAddress.toString() === WSOL.mint) {
        const newAccount = new Keypair()
        transaction.add(
            SystemProgram.createAccount({
                fromPubkey: owner,
                newAccountPubkey: newAccount.publicKey,
                lamports: parseInt(pcVol.toFixed()) + 1e7,
                space: SPL_ACCOUNT_LAYOUT.span,
                programId: TOKEN_PROGRAM_ID
            })
        )
        transaction.add(
            initializeAccount({
                account: newAccount.publicKey,
                mint: new PublicKey(WSOL.mint),
                owner
            })
        )
        transaction.add(Spl.makeTransferInstruction({
            source: newAccount.publicKey,
            destination: poolPcTokenAccount,
            owner: owner,
            amount: parseInt(pcVol.toFixed())
        }));

        transaction.add(
            closeAccount({
                source: newAccount.publicKey,
                destination: owner,
                owner
            })
        )
        signers.push(newAccount)
    } else {
        transaction.add(
            Spl.makeTransferInstruction({
                source: new PublicKey(quoteToken),
                destination: poolPcTokenAccount,
                owner: owner,
                amount: parseInt(pcVol.toFixed())
            })
        )
    }

    const txid = await provider.sendAndConfirm(transaction, signers, {
        skipPreflight: true,
        preflightCommitment: "confirmed"
    })
    console.log("initAMM txid:", txid)
    // checkTxid(conn, txid)
}

