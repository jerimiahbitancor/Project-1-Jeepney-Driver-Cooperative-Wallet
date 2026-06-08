import {
  Horizon,
  Asset,
  TransactionBuilder,
  Operation,
  Networks,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { HORIZON_URL, TESTNET_USDC_ISSUER, USDC_CODE } from "@/constants";

const server = new Horizon.Server(HORIZON_URL);

export async function fetchBalances(publicKey: string) {
  try {
    const account = await server.loadAccount(publicKey);
    const balances = account.balances.map((b) => {
      if ("asset_code" in b) {
        return {
          asset: b.asset_code,
          balance: b.balance,
          issuer: b.asset_issuer,
        };
      } else {
        return {
          asset: "XLM",
          balance: b.balance,
          issuer: undefined,
        };
      }
    });
    return balances;
  } catch (error) {
    console.error("Error fetching balances:", error);
    throw error;
  }
}

export async function buildFarePaymentTransaction(
  publicKey: string,
  destination: string,
  amount: string
) {
  const account = await server.loadAccount(publicKey);
  const usdcAsset = new Asset(USDC_CODE, TESTNET_USDC_ISSUER);

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: usdcAsset,
        amount,
      })
    )
    .setTimeout(60)
    .build();

  return transaction.toXDR();
}

export async function submitTransaction(signedXdr: string) {
  const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  return await server.submitTransaction(tx);
}
