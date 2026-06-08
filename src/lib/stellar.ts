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
    
    if (!account || !account.balances) {
      return [{ asset: "XLM", balance: "0.0000000" }];
    }

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
  } catch (error: any) {
    // Log the full error for better debugging in the console
    console.warn("Stellar balance fetch info:", error.message || error);

    // If account is not found (404), return zero XLM
    if (error?.response?.status === 404 || error?.message?.includes("404")) {
      return [
        {
          asset: "XLM",
          balance: "0.0000000",
          issuer: undefined,
        },
      ];
    }
    
    // For other errors (network, etc.), return a placeholder instead of throwing
    return [
      {
        asset: "XLM",
        balance: "Unavailable",
        issuer: undefined,
      },
    ];
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
