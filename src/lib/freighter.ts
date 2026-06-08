import { isConnected, signTransaction, getNetwork, requestAccess, getPublicKey } from "@stellar/freighter-api";

const TIMEOUT_MS = 2000;

export async function checkFreighterConnection() {
  if (typeof window === "undefined") return false;

  const connectionPromise = isConnected();
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Freighter connection timed out")), TIMEOUT_MS)
  );

  try {
    const connected = await Promise.race([connectionPromise, timeoutPromise]);
    return !!connected;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function connectWallet() {
  if (!(await checkFreighterConnection())) {
    throw new Error("Freighter not found or not connected");
  }

  const publicKey = await requestAccess();
  if (!publicKey) {
    throw new Error("User denied access or no public key found");
  }

  return publicKey;
}

export async function signWithFreighter(xdr: string) {
  try {
    console.log("Requesting signature for XDR:", xdr);
    const result = await signTransaction(xdr, { 
      network: "TESTNET",
      networkPassphrase: "Test SDF Network ; September 2015" 
    });
    
    if (!result) {
      console.warn("Freighter returned a null/empty result");
      return null;
    }
    
    console.log("Freighter signature result:", result);

    if (typeof result === "string") return result;
    
    const signedXdr = (result as any).signedTransaction || (result as any).xdr || (result as any).signedXdr;
    return signedXdr || null;
  } catch (error) {
    console.error("CRITICAL: Freighter signing error:", error);
    return null;
  }
}

export async function checkCurrentNetwork() {
  if (typeof window === "undefined") return null;
  return await getNetwork();
}

export async function getUserPublicKey() {
  if (typeof window === "undefined") return null;
  return await getPublicKey();
}
