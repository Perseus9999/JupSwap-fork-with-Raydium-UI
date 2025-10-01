import { web3 } from "@project-serum/anchor";
import { associatedAddress, TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { calculateGlobalDataPda, calculateStakeEntryPda, calculateStakePoolPda } from "./pda";

export async function getInitializeAccounts(admin: web3.PublicKey) {
    let globalDataPda = await calculateGlobalDataPda();
    return {
        admin,
        globalData: globalDataPda[0],
        systemProgram: web3.SystemProgram.programId
    }
}

export async function getSetStakePoolRewardsAccounts(admin: web3.PublicKey, stakePool: web3.PublicKey) {
    return {
        admin,
        stakePool
    }
}

export async function getCreateStakePoolAccounts(
    creator: web3.PublicKey,
    mintA: web3.PublicKey,
    mintB: web3.PublicKey,
    id: number) {
    let globalDataPda = await calculateGlobalDataPda();
    let stakePoolPda = await calculateStakePoolPda(id);
    let escrowA = await associatedAddress({mint: mintA, owner: stakePoolPda[0]});
    let escrowB = await associatedAddress({mint: mintB, owner: stakePoolPda[0]});

    return {
        creator: creator,
        mintA: mintA,
        mintB: mintB,
        globalData: globalDataPda[0],
        escrowA: escrowA,
        escrowB: escrowB,
        stakePool: stakePoolPda[0],
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: web3.SYSVAR_RENT_PUBKEY
    }
}

export async function getCreateStakeEntryAccounts(
    user: web3.PublicKey,
    stakePool: web3.PublicKey) {
    let globalDataPda = await calculateGlobalDataPda();
    let stakeEntryPda = await calculateStakeEntryPda(user, stakePool);

    return {
        user: user,
        globalData: globalDataPda[0],
        stakePool: stakePool,
        stakeEntry: stakeEntryPda[0],
        systemProgram: web3.SystemProgram.programId
    }
}

export async function getStakeAccounts(
    user: web3.PublicKey,
    stakePool: web3.PublicKey,
    mintA: web3.PublicKey) {
    let stakeEntryPda = await calculateStakeEntryPda(user, stakePool);
    let escrowA = await associatedAddress({ mint: mintA, owner: stakePool});
    let stakerTokenA = await associatedAddress({mint: mintA, owner: user});
    return {
        staker: user,
        stakePool: stakePool,
        stakeEntry: stakeEntryPda[0],
        stakerTokenA: stakerTokenA,
        escrowA: escrowA,
        mintA: mintA,
        tokenProgram: TOKEN_PROGRAM_ID
    }
}

export async function getUnstakeAccounts(
    user: web3.PublicKey,
    stakePool: web3.PublicKey,
    mintA: web3.PublicKey) {
    let stakeEntryPda = await calculateStakeEntryPda(user, stakePool);
    let escrowA = await associatedAddress({ mint: mintA, owner: stakePool});
    let stakerTokenA = await associatedAddress({mint: mintA, owner: user});
    return {
        staker: user,
        stakePool: stakePool,
        stakeEntry: stakeEntryPda[0],
        stakerTokenA: stakerTokenA,
        escrowA: escrowA,
        mintA: mintA,
        tokenProgram: TOKEN_PROGRAM_ID
    }
}

export async function getClaimRewardsAccounts(
    user: web3.PublicKey,
    stakePool: web3.PublicKey,
    mintB: web3.PublicKey) {
    let stakeEntryPda = await calculateStakeEntryPda(user, stakePool);
    let escrowB = await associatedAddress({ mint: mintB, owner: stakePool});
    let stakerB = await associatedAddress({mint: mintB, owner: user});
    return {
        staker: user,
        stakePool: stakePool,
        stakeEntry: stakeEntryPda[0],
        stakerB: stakerB,
        escrowB: escrowB,
        mintB: mintB,
        tokenProgram: TOKEN_PROGRAM_ID
    }
}