<div align="center">
  <img src="public/logo.png" alt="Isaura Logo" width="120"/>
  <h1>Isaura</h1>
</div>

Isaura is a multi-wallet crypto portfolio tracking platform that allows you to monitor all your crypto wallets in one unified dashboard. Built with Next.js and powered by AdEx Aura, Isaura provides real-time portfolio insights and AI-powered investment strategies.

## 🎯 Key Features

-   💼 **Multi-Wallet Tracking** - Add up to 10 Ethereum wallet addresses and view them as a single, unified portfolio
-   📊 **Real-Time Portfolio Analytics** - Track your token balances, values, and performance across multiple networks
-   🤖 **AI-Powered Strategies** - Get personalized investment recommendations powered by AdEx AURA for each wallet or your combined portfolio
-   🔐 **Secure Authentication** - Login with wallet or email via Privy authentication
-   🔒 **End-to-End Encryption** - All wallet addresses are encrypted and securely stored in MongoDB
-   📥 **Portfolio Export** - Export your portfolio data to Excel or CSV formats for analysis
-   🌓 **Dark/Light Mode** - Full theme support for comfortable viewing in any environment
-   💹 **Real-Time Price Data** - Live BTC and ETH prices with 24h change tracking

## 🌐 Live Demo

The project is hosted at [https://isaura.xyz](https://isaura.xyz). If you don't want to run it locally, you can use the live version.

## 🚀 Getting Started

### 📋 Prerequisites

Before running the project locally, you need to set up your environment variables:

1. Copy the example environment file:

```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and fill in the required values:
    - `MONGODB_URI` - Your MongoDB connection string
    - `JWT_SECRET` - A secret key for JWT token generation
    - `AURA_API_KEY` - Your Aura API key
    - `OPENAI_API_KEY` - Your OpenAI API key for AI features
    - `NEXT_PUBLIC_PRIVY_APP_ID` - Your Privy app ID for authentication
    - `PRIVY_APP_SECRET` - Your Privy app secret

### ▶️ Running the Development Server

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
