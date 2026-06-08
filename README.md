# Jeepney Tap-to-Pay — Micro‑Fare on Stellar

One‑tap jeepney fare payment using Stellar USDC — fast, cheap, and cashless.

## Problem

Jeepney and tricycle fares in the Philippines are paid in cash. Coins are scarce, drivers don't have change, and fare disputes happen daily. Riders want a simple digital alternative, but existing payment apps charge fees that make ₱13–20 fares uneconomical.

## How It Works

1. Rider opens the web app on their phone.
2. Connects their Freighter wallet (Stellar testnet).
3. Sees their XLM and USDC balance.
4. Clicks **“Pay ₱13 Jeepney Fare”**.
5. Approves the transaction in Freighter.
6. The app sends exactly 0.13 USDC to the driver’s fixed Stellar address.
7. A success screen appears with the transaction hash and a link to Stellar Expert.

No route selection, no drop‑off picker – just a working micro‑payment demo that proves the concept.

## How It Uses Stellar

- **USDC (testnet)**: The fare is paid in USDC, a stable asset.
- **Freighter wallet**: Riders sign transactions locally – self‑custodial.
- **Stellar SDK v14**: Builds, signs, submits, and polls transactions.
- **Horizon API**: Fetches account balances.
- **Testnet**: All transactions run on Stellar testnet, using Friendbot for funding and a fixed USDC issuer (`GBBD47...`).

Stellar’s sub‑cent fees make a ₱13 micro‑fare economically viable – something impossible with credit cards or traditional banking.

## Track

**Track 2 – Financial Inclusion & Everyday Payments**  
(Jeepney fare digitisation fits “replacing cash with digital payments for the underbanked”.)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Stellar SDK**: `@stellar/stellar-sdk` v14
- **Wallet integration**: `@stellar/freighter-api` v6 (dynamic imports, timeout wrapper)
- **Network**: Stellar testnet

## Setup & Run

### Prerequisites
- Node.js 18+ and npm
- Freighter browser extension (install from [freighter.app](https://freighter.app))
- A testnet account in Freighter (with XLM from Friendbot and some USDC for paying fares)

### Installation

```bash
git clone https://github.com/jerimiahbitancor/Project-1-Jeepney-Driver-Cooperative-Wallet.git
cd Project-1-Jeepney-Driver-Cooperative-Wallet
npm install