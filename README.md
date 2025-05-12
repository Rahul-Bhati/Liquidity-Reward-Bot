# 💧 Liquidity Position + Farm Reward Tracker Bot (Solana)

A backend + bot tool that tracks a user's **single-sided liquidity pool positions** and corresponding **farm rewards** on Solana.
![image](https://github.com/user-attachments/assets/732a8acd-aab9-4951-9698-ed00eac7e5c8)


## 🧠 Use Case

This bot is designed for Solana DeFi users to **track their LP positions and pending farm rewards** automatically — think of it like your **DeFi notifications assistant**.

## 🔍 Features

- Input: Pool ID + Wallet Address
- Tracks:
  - Token amount in range
  - Total value (via price feed)
  - Associated farm reward info
- [WIP] Returns notification if reward is **claimable**
- [WIP] Integrate with **Twitter bot** or Telegram to ping user

## ⚙️ How It Works

1. User gives pool ID and wallet address.
2. Bot checks token position via RPC calls / SDKs.
3. Matches pool with farm program and parses reward info.
4. [Planned] Sends alert if reward > threshold or claimable now.

## 📌 Status

- [x] Pool info parsing
- [x] Token position tracking
- [x] Farm Fetching and showing APR
- [x] Reward fetching from farm contract
- [x] Twitter/Telegram bot notifications
- [ ] Frontend dashboard (optional)

## 🛠️ Stack

- Node.js + Solana Web3.js + Raydium SDK
- Twitter API / Telegram API
- Redis (for job queue)
- PostgreSQL (optional cache)


## 💡 Next Steps

- Add real-time WS subscriptions
- Alert when:
  - Reward > threshold
  - Position drops significantly
- Mint on-chain badge if user farms for > 30 days (link to badge system)


