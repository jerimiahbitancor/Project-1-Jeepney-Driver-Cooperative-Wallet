const TIMEOUT_MS = 2000;

async function getFreighter() {
  if (typeof window === "undefined") return null;
  return await import("@stellar/freighter-api");
}

export async function checkFreighterConnection() {
  const freighter = await getFreighter();
  if (!freighter) return false;

  const connectionPromise = freighter.isConnected();
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
  const freighter = await getFreighter();
  if (!freighter) throw new Error("Freighter not available");

  if (!(await checkFreighterConnection())) {
    throw new Error("Freighter not found or not connected");
  }

  const publicKey = await freighter.getPublicKey();
  if (!publicKey) {
    throw new Error("User denied access or no public key found");
  }

  return publicKey;
}

export async function signWithFreighter(xdr: string) {
  const freighter = await getFreighter();
  if (!freighter) throw new Error("Freighter not available");
  return await freighter.signTransaction(xdr, { network: "TESTNET" });
}

export async function checkNetwork() {
  const freighter = await getFreighter();
  if (!freighter) return null;
  const network = await freighter.getNetwork();
  return network;
}
