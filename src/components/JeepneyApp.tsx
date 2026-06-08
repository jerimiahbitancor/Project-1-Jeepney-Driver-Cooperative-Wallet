"use client";

import { useState } from "react";
import { connectWallet, checkCurrentNetwork, getUserPublicKey } from "@/lib/freighter";
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
      const networkResult = await checkCurrentNetwork();
      const network = typeof networkResult === "string" ? networkResult : (networkResult as any).network;
      
      if (network !== "TESTNET") {
        throw new Error(`Switch Freighter to TESTNET`);
      }

      const currentResult = await getUserPublicKey();
      const currentKey = typeof currentResult === "string" ? currentResult : (currentResult as any).address;
      
      if (currentKey && currentKey !== publicKey) {
        setPublicKey(currentKey);
        throw new Error("Account changed. Please try again.");
      }

      const xdr = await buildFarePaymentTransaction(publicKey, TESTNET_DRIVER_ADDRESS, FARE_AMOUNT);
      const signedXdr = await signWithFreighter(xdr);
      if (!signedXdr) throw new Error("Signing failed or rejected.");
      
      const result = await submitTransaction(signedXdr);
      setTxHash(result.hash);
      
      const b = await fetchBalances(publicKey);
      setBalances(b);
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Payment failed. Check your XLM balance.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black text-white selection:bg-indigo-500/30">
      {/* Background patterns */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-800 blur-[120px]" />
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10 space-y-2">
            <h1 className="text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
              JEEPNEY<span className="text-indigo-500">PAY</span>
            </h1>
            <p className="text-gray-400 font-medium tracking-wide uppercase text-xs">
              StellarX Philippines Micro-fare
            </p>
          </div>

          {/* Main Card */}
          <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8 space-y-8 relative overflow-hidden group transition-all duration-500 hover:border-white/20">
            {!publicKey ? (
              <div className="py-8 space-y-8 text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                  <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-3 group-hover:rotate-6 transition-transform">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold">Welcome back</h2>
                  <p className="text-gray-400 text-sm">Connect your Freighter wallet to start paying your jeepney fares instantly.</p>
                </div>

                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full group relative flex items-center justify-center py-4 bg-white text-black rounded-2xl font-bold text-lg overflow-hidden transition-all active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative">{loading ? "Connecting..." : "Connect Wallet"}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Wallet & Balance Header */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Wallet</p>
                    <p className="text-sm font-mono text-gray-300 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                      {publicKey.slice(0, 6)}...{publicKey.slice(-4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Network</p>
                    <span className="flex items-center gap-1.5 justify-end">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <p className="text-xs font-bold text-green-500">TESTNET</p>
                    </span>
                  </div>
                </div>

                {/* Balance Display */}
                <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/5 space-y-4">
                  {balances.map((b, i) => (
                    <div key={i} className="flex justify-between items-end">
                      <p className="text-gray-400 text-sm font-medium">{b.asset}</p>
                      <p className="text-2xl font-bold tracking-tight">
                        {parseFloat(b.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-xs text-gray-500 ml-1.5 font-medium">{b.asset}</span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* Action Section */}
                {!txHash ? (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <p className="text-gray-500 text-xs font-medium">Fixed Fare Amount</p>
                      <p className="text-3xl font-black text-white">0.13 XLM</p>
                    </div>

                    <button
                      onClick={handlePayment}
                      disabled={loading}
                      className="w-full relative group py-5 bg-indigo-600 rounded-2xl overflow-hidden transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative text-xl font-black tracking-wide">
                        {loading ? "PROCESSING..." : "PAY ₱13 FARE"}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-green-400">Paid Successfully</h3>
                      <p className="text-gray-400 text-sm px-4">Your jeepney fare has been processed on the Stellar Network.</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <a
                        href={`${STELLAR_EXPERT_URL}${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors"
                      >
                        Explorer Receipt
                      </a>
                      <button
                        onClick={() => setTxHash(null)}
                        className="text-gray-500 text-xs font-bold hover:text-white transition-colors"
                      >
                        Make another payment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Toast */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex gap-3 items-center">
                <div className="p-1.5 bg-red-500/20 rounded-lg">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-400 text-sm font-semibold">{error}</p>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <footer className="mt-12 text-center text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] space-y-4">
            <p>Authorized Payment Hub • Manila, PH</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
