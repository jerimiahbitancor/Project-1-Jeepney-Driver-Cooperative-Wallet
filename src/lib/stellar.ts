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
    console.warn("Stellar balance fetch info:", error.message || error);
    if (error?.response?.status === 404 || error?.message?.includes("404")) {
      return [{ asset: "XLM", balance: "0.0000000", issuer: undefined }];
    }
    return [{ asset: "XLM", balance: "Unavailable", issuer: undefined }];
  }
}

export async function buildTrustlineTransaction(publicKey: string) {
  const account = await server.loadAccount(publicKey);
  const usdcAsset = new Asset(USDC_CODE, TESTNET_USDC_ISSUER);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.changeTrust({
        asset: usdcAsset,
      })
    )
    .setTimeout(60)
    .build();

  return tx.toXDR();
}

export async function buildFarePaymentTransaction(
  publicKey: string,
  destination: string,
  amount: string
) {
  const sourceAccount = await server.loadAccount(publicKey);
  
  // Use XLM (Native Asset) - No trustline required!
  const nativeAsset = Asset.native();

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: nativeAsset,
        amount,
      })
    )
    .setTimeout(60)
    .build();

  return tx.toXDR();
}

export async function submitTransaction(signedXdr: string) {
  const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  return await server.submitTransaction(tx);
}
