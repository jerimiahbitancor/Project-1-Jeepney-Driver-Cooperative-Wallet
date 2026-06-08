"use client";

import { useState } from "react";
import { connectWallet } from "@/lib/freighter";
import { fetchBalances, buildFarePaymentTransaction, submitTransaction } from "@/lib/stellar";
import { signWithFreighter } from "@/lib/freighter";
import { TESTNET_DRIVER_ADDRESS, FARE_AMOUNT, STELLAR_EXPERT_URL } from "@/constants";

interface Balance {
  asset: string;
  balance: string;
  issuer?: string;
}

export default function JeepneyApp() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await connectWallet();
      const key = typeof result === "string" ? result : (result as any).address;
      setPublicKey(key);
      const b = await fetchBalances(key);
      setBalances(b);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      // 1. Check if wallet is on the correct network first
      const network = await import("@stellar/freighter-api").then(m => m.getNetwork());
      if (network !== "TESTNET") {
        throw new Error(`Please switch your Freighter wallet to TESTNET (Current: ${network})`);
      }

      const xdr = await buildFarePaymentTransaction(publicKey, TESTNET_DRIVER_ADDRESS, FARE_AMOUNT);
      
      // Log XDR to console for manual verification if needed
      console.log("Transaction XDR created:", xdr);
      
      const signedXdr = await signWithFreighter(xdr);
      if (!signedXdr) throw new Error("Signing failed. Did you reject the transaction in Freighter?");
      
      const result = await submitTransaction(signedXdr);
      setTxHash(result.hash);
      
      // Refresh balances after payment
      const b = await fetchBalances(publicKey);
      setBalances(b);
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Payment failed. Do you have enough USDC and a trustline?";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-blue-600">Jeepney Pay</h1>
        <p className="text-center text-gray-500 italic">Tap-to-pay for StellarX Philippines</p>

        {!publicKey ? (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Connect Freighter Wallet"}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-400 truncate">Wallet: {publicKey}</p>
              <div className="mt-2 space-y-1">
                {balances.map((b, i) => (
                  <p key={i} className="text-sm font-medium">
                    {b.asset}: <span className="text-blue-600">{parseFloat(b.balance).toFixed(2)}</span>
                  </p>
                ))}
              </div>
            </div>

            {!txHash ? (
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full py-4 bg-green-500 text-white rounded-xl text-xl font-bold hover:bg-green-600 transition shadow-lg disabled:opacity-50"
              >
                {loading ? "Processing..." : `Pay ₱13 Jeepney Fare`}
              </button>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                <p className="text-green-700 font-bold text-lg">Payment Successful! 🎉</p>
                <a
                  href={`${STELLAR_EXPERT_URL}${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-blue-500 underline text-sm"
                >
                  View on Stellar Expert
                </a>
                <button
                  onClick={() => setTxHash(null)}
                  className="mt-4 text-xs text-gray-400 hover:text-gray-600"
                >
                  Make another payment
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
