import jFetch from "@/functions/dom/jFetch"
import useConnection from "../connection/useConnection";
import { PublicKey } from "@solana/web3.js";
import { LIQUIDITY_STATE_LAYOUT_V4 } from "@raydium-io/raydium-sdk";

// export const GET_PRICE_ENDPOINT = "https://price.jup.ag/v4/price?ids="
export const GET_PRICE_ENDPOINT = "https://lite-api.jup.ag/price/v2?ids="

export async function getTokenPrice(mintString: string) {
  const result = await jFetch(GET_PRICE_ENDPOINT + mintString)

  return result.data[mintString]
}

export async function getLpPrice(lpPoolID: string): Promise<number | undefined> {
  const connection = useConnection.getState().connection;
  if (!connection) return;
  const poolIDPublicKey = new PublicKey(lpPoolID);
  const lpAccountInfo = await connection.getAccountInfo(poolIDPublicKey);

  if (!lpAccountInfo) {
    throw new Error('Failed to find mint account');
  }

  const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(lpAccountInfo.data);

  const baseDecimal = 10 ** poolState.baseDecimal.toNumber(); // e.g. 10 ^ 6
  const quoteDecimal = 10 ** poolState.quoteDecimal.toNumber();
  const baseTokenAmount = await connection.getTokenAccountBalance(poolState.baseVault);
  const quoteTokenAmount = await connection.getTokenAccountBalance(poolState.quoteVault);

  const basePnl = poolState.baseNeedTakePnl.toNumber() / baseDecimal;
  const quotePnl = poolState.quoteNeedTakePnl.toNumber() / quoteDecimal;

  const base = (baseTokenAmount.value?.uiAmount || 0) - basePnl;
  const quote = (quoteTokenAmount.value?.uiAmount || 0) - quotePnl;

  let basePrice = 0;
  let quotePrice = 0;
  try {
    const baseMint = poolState.baseMint.toString();
    let resp = await getTokenPrice(baseMint)
    if (resp.price) {
      const temp = parseFloat(resp.price);
      basePrice = temp;
    }
    const quoteMint = poolState.baseMint.toString();
    resp = await getTokenPrice(quoteMint)
    if (resp.price) {
      const temp = parseFloat(resp.price);
      quotePrice = temp;
    }
  } catch (error) {
    console.error('Error fetching token price::', error);
  }
  const lpMintSupply = await connection.getTokenSupply(poolState.lpMint);
  const lpUiSupply = lpMintSupply.value.uiAmount;
  if (lpUiSupply == 0 || !lpUiSupply) {
    return 0;
  } else {
    const lpPrice = (base * basePrice + quote * quotePrice) / lpUiSupply;
    return lpPrice;
  }
}