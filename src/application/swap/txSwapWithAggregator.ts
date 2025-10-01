import { forecastTransactionSize, InnerSimpleTransaction, InstructionType, publicKey, TradeV2 } from '@raydium-io/raydium-sdk'
import { ComputeBudgetProgram, SignatureResult, Connection, VersionedTransaction, PublicKey } from '@solana/web3.js'

import assert from '@/functions/assert'
import { toTokenAmount } from '@/functions/format/toTokenAmount'
import { isMintEqual } from '@/functions/judgers/areEqual'
import { gt } from '@/functions/numberish/compare'
import { toString } from '@/functions/numberish/toString'

import useAppAdvancedSettings from '../common/useAppAdvancedSettings'
import { TxHistoryInfo } from '../txHistory/useTxHistory'
import { getComputeBudgetConfig } from '../txTools/getComputeBudgetConfig'
import txHandler, { lookupTableCache, TransactionQueue } from '../txTools/handleTx'
import useWallet from '../wallet/useWallet'

import { useAggregator } from './useAggregator'
import jFetch from '@/functions/dom/jFetch'
import toPubString from '@/functions/format/toMintString'
import tryCatch from '@/functions/tryCatch'
import { SlopeWalletAdapter } from '@solana/wallet-adapter-wallets'
import { ReferralProvider } from "@jup-ag/referral-sdk";
import { Numberish } from '@/types/constants'


interface QuoteResponse {
  inputMint: string;
  outputMint: string;
  outAmount: string;
}

export const AGGREGATE_SWAP_QUOTE_ENDPOINT = "https://lite-api.jup.ag/swap/v1/quote";

export async function getQuote(_inputMint: string | PublicKey, _outputMint: string | PublicKey, _amount: string, _slippageBps: Numberish | undefined) {
  try {
    const url = new URL(AGGREGATE_SWAP_QUOTE_ENDPOINT)
    url.searchParams.append(
      'inputMint',
      typeof _inputMint === 'string' ? _inputMint : _inputMint.toBase58()
    );

    url.searchParams.append(
      'outputMint',
      typeof _outputMint === 'string' ? _outputMint : _outputMint.toBase58()
    );

    url.searchParams.append('amount', _amount);
    url.searchParams.append('slippageBps', _slippageBps !== undefined ? toString(_slippageBps) : '0');
    url.searchParams.append('restrictIntermediateTokens', 'true');
    url.searchParams.append('platformFeeBps', '20');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Error fetching quote: ${response.statusText}`);
    }

    const quoteResponse = await response.json();

    // console.log("debug->quoteResponse", quoteResponse)
    return quoteResponse

  } catch (error) {
    console.error('Failed to get quote:', error);
  }
}

export async function swapQuote(_quoteResponse: any, _owner: PublicKey, _feeAccount: PublicKey) {
  try {
    const requestBody: any = {
      quoteResponse: _quoteResponse,
      userPublicKey: typeof _owner === "string" ? _owner : _owner.toBase58(),
      feeAccount: _feeAccount.toBase58(),
      payer: typeof _owner === "string" ? _owner : _owner.toBase58(),
      dynamicComputeUnitLimit: true,
      dynamicSlippage: true,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          maxLamports: 1000000, // Cap fee at 0.001 SOL
          global: false, // Use local fee market for better estimation
          priorityLevel: "veryHigh", // veryHigh === 75th percentile for better landing
        },
      }
    };

    const response = await fetch('https://lite-api.jup.ag/swap/v1/swap', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json()
    // console.log("debug->swaprespnose", data)
    return data
  } catch (error) {
    console.error("swapquote error", error);
  }
}

export async function findFeeAccount(referralAccountPubKey: PublicKey, mint: PublicKey) {
  const [feeAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("referral_ata"),
      referralAccountPubKey.toBuffer(),
      mint.toBuffer()
    ],
    new PublicKey("REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3")
  )
  // console.log("debug->feeAccount", feeAccount.toBase58(), "seperate")
  return feeAccount;
}


export default async function txSwapWithAggregator() {
  const { programIds } = useAppAdvancedSettings.getState()
  const { checkWalletHasEnoughBalance, tokenAccountRawInfos, txVersion } = useWallet.getState()
  const {
    coin1,
    coin2,
    coin1Amount,
    coin2Amount,
    routePlan,
    slippageBps,
    priceImpact,
    otherAmountThreshold,
    timeTaken,
    contextSlot,

    focusSide,
    routeType,
    directionReversed,
    minReceived,
    maxSpent
  } = useAggregator.getState()

  const referralAccountPublicKey = new PublicKey("3PMgX24mu313voK3XRQ2m5Q2VLhMx89s8Rpo8gWDxH2X")

  const upCoin = directionReversed ? coin2 : coin1
  // although info is included in routes, still need upCoinAmount to pop friendly feedback
  const upCoinAmount = (directionReversed ? coin2Amount : coin1Amount) || '0'

  const downCoin = directionReversed ? coin1 : coin2
  // although info is included in routes, still need downCoinAmount to pop friendly feedback
  const downCoinAmount = (directionReversed ? coin1Amount : coin2Amount) || '0'

  assert(upCoinAmount && gt(upCoinAmount, 0), 'should input upCoin amount larger than 0')
  assert(downCoinAmount && gt(downCoinAmount, 0), 'should input downCoin amount larger than 0')
  assert(upCoin, 'select a coin in upper box')
  assert(downCoin, 'select a coin in lower box')
  assert(!isMintEqual(upCoin.mint, downCoin.mint), 'should not select same mint ')

  const upCoinTokenAmount = toTokenAmount(upCoin, upCoinAmount, { alreadyDecimaled: true })
  const downCoinTokenAmount = toTokenAmount(downCoin, downCoinAmount, { alreadyDecimaled: true })

  assert(checkWalletHasEnoughBalance(upCoinTokenAmount), `not enough ${upCoin.symbol}`)


  return txHandler(async ({ transactionCollector, baseUtils: { connection, owner } }) => {

    const quoteResponse = await getQuote(upCoin.mint, downCoin.mint, parseInt((parseFloat(upCoinAmount.toString()) * Math.pow(10, upCoin.decimals)).toString()).toString(), slippageBps);
    const feeTokenAccount = await findFeeAccount(referralAccountPublicKey, upCoin.mint);

    if (!quoteResponse) {
      console.error("unable to quote")
      return;
    }

    if (!feeTokenAccount) {
      console.error("unable to find fee account")
      return;
    }

    const executeResponse = await swapQuote(quoteResponse, owner, feeTokenAccount);

    const transactionBinary = Buffer.from(
      executeResponse.swapTransaction,
      "base64"
    );

    const deserializedTransaction = VersionedTransaction.deserialize(new Uint8Array(transactionBinary));

    // Sign the deserialized transaction with the connected wallet
    const { signTransaction } = useWallet.getState();
    if (!signTransaction) {
      throw new Error("Wallet does not support signing transactions.");
    }
    const signedTransaction = await signTransaction(deserializedTransaction);

    const serializedSignedTransaction = signedTransaction.serialize();

    const signature = await connection.sendRawTransaction(serializedSignedTransaction, { skipPreflight: true });

    transactionCollector.add(deserializedTransaction, {
      txHistoryInfo: {
        title: 'Swap',
        description: `Swap ${upCoinAmount.toString()} ${upCoin.symbol} to ${downCoinAmount.toString()} ${downCoin.symbol}`
      }
    })
  })
}

function translationSwapTxDescription(tx: InnerSimpleTransaction, idx: number, allTxs: InnerSimpleTransaction[]) {
  const swapFirstIdx = allTxs.findIndex((tx) => isSwapTransaction(tx))
  const swapLastIdx = allTxs.length - 1 - [...allTxs].reverse().findIndex((tx) => isSwapTransaction(tx))
  return idx < swapFirstIdx ? 'Setup' : idx > swapLastIdx ? 'Cleanup' : 'Swap'
}

function isSwapTransaction(tx: InnerSimpleTransaction): boolean {
  return (
    tx.instructionTypes.includes(InstructionType.clmmSwapBaseIn) ||
    tx.instructionTypes.includes(InstructionType.clmmSwapBaseOut) ||
    tx.instructionTypes.includes(InstructionType.ammV4Swap) ||
    tx.instructionTypes.includes(InstructionType.ammV4SwapBaseIn) ||
    tx.instructionTypes.includes(InstructionType.ammV4SwapBaseOut) ||
    tx.instructionTypes.includes(InstructionType.ammV5SwapBaseIn) ||
    tx.instructionTypes.includes(InstructionType.ammV5SwapBaseOut) ||
    tx.instructionTypes.includes(InstructionType.routeSwap1) ||
    tx.instructionTypes.includes(InstructionType.routeSwap2) ||
    tx.instructionTypes.includes(InstructionType.routeSwap)
  )
}

/**
 * @author RUDY
 */
function checkSwapSlippageError(err: SignatureResult): boolean {
  try {
    // @ts-expect-error force
    const coustom = err.err?.InstructionError[1].Custom
    if ([38, 6022].includes(coustom)) {
      return true
    } else {
      return false
    }
  } catch {
    return false
  }
}
