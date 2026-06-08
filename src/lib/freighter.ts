import { isConnected, signTransaction, getNetwork, requestAccess } from "@stellar/freighter-api";

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

  // requestAccess is preferred in v6 to prompt the user for connection
  const publicKey = await requestAccess();
  if (!publicKey) {
    throw new Error("User denied access or no public key found");
  }

  return publicKey;
}

export async function signWithFreighter(xdr: string) {
  const result = await signTransaction(xdr, { network: "TESTNET" });
  // Some versions of Freighter return an object { signedTransaction: "..." }
  return typeof result === "string" ? result : (result as any).signedTransaction;
}

export async function checkNetwork() {
  if (typeof window === "undefined") return null;
  const network = await getNetwork();
  return network;
}
