import { AuraResponse, AuraPortfolioEntry, AuraNetwork } from '@/types/aura';

// Simple, hardcoded mock data you can freely edit.
// 1) Replace the example addresses with your own.
// 2) Add/remove tokens or networks as needed.

const NETWORKS: AuraNetwork[] = [
	{ name: 'Ethereum', chainId: '1', platformId: 'ethereum', explorerUrl: 'https://etherscan.io' },
	{ name: 'Arbitrum One', chainId: '42161', platformId: 'arbitrum', explorerUrl: 'https://arbiscan.io' },
	{ name: 'Base', chainId: '8453', platformId: 'base', explorerUrl: 'https://basescan.org' },
];

// Default entries returned when a wallet isn't explicitly listed below
const DEFAULT_ENTRIES: AuraPortfolioEntry[] = [
	{
		network: NETWORKS[0],
		tokens: [
			{
				symbol: 'ETH',
				balance: 0.1,
				balanceUSD: 0.1 * 3500,
				address: '0x0000000000000000000000000000000000000000',
			},
			{ symbol: 'USDC', balance: 25, balanceUSD: 25, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
		],
	},
	{
		network: NETWORKS[1],
		tokens: [
			{
				symbol: 'ETH',
				balance: 0.03,
				balanceUSD: 0.03 * 3500,
				address: '0x0000000000000000000000000000000000000000',
			},
			{
				symbol: 'WETH',
				balance: 0.01,
				balanceUSD: 0.01 * 3500,
				address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
			},
		],
	},
	{
		network: NETWORKS[2],
		tokens: [
			{
				symbol: 'ETH',
				balance: 0.02,
				balanceUSD: 0.02 * 3500,
				address: '0x0000000000000000000000000000000000000000',
			},
		],
	},
];

// Per-wallet hardcoded portfolio entries. Use lowercase keys.
// Tip: paste your own wallet addresses as keys and edit balances/tokens freely.
const MOCK_WALLETS: Record<string, AuraPortfolioEntry[]> = {
	// Wallet A
	'0xa8835972379e8a89e33dc2cab88aacf22a8dd515': [
		{
			network: NETWORKS[0],
			tokens: [
				{
					symbol: 'ETH',
					balance: 0.15,
					balanceUSD: 0.15 * 3500,
					address: '0x0000000000000000000000000000000000000000',
				},
				{
					symbol: 'WETH',
					balance: 0.02,
					balanceUSD: 0.02 * 3500,
					address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
				},
				{ symbol: 'USDC', balance: 50, balanceUSD: 50, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
			],
		},
		{
			network: NETWORKS[1],
			tokens: [
				{
					symbol: 'ETH',
					balance: 0.06,
					balanceUSD: 0.06 * 3500,
					address: '0x0000000000000000000000000000000000000000',
				},
				{
					symbol: 'ARB',
					balance: 10,
					balanceUSD: 10 * 1.0,
					address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
				},
			],
		},
		{
			network: NETWORKS[2],
			tokens: [
				{
					symbol: 'ETH',
					balance: 0.03,
					balanceUSD: 0.03 * 3500,
					address: '0x0000000000000000000000000000000000000000',
				},
				{ symbol: 'USDC', balance: 15, balanceUSD: 15, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
			],
		},
	],

	// Wallet B
	'0x16cfb46435a70b9e318baa1bacb0b5e4bf2dee9e': [
		{
			network: NETWORKS[0],
			tokens: [
				{
					symbol: 'ETH',
					balance: 0.08,
					balanceUSD: 0.08 * 3500,
					address: '0x0000000000000000000000000000000000000000',
				},
				{ symbol: 'DAI', balance: 30, balanceUSD: 30, address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
				{
					symbol: 'WBTC',
					balance: 0.0015,
					balanceUSD: 0.0015 * 65000,
					address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
				},
			],
		},
		{
			network: NETWORKS[1],
			tokens: [
				{
					symbol: 'ETH',
					balance: 0.04,
					balanceUSD: 0.04 * 3500,
					address: '0x0000000000000000000000000000000000000000',
				},
				{ symbol: 'USDC', balance: 10, balanceUSD: 10, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
				{
					symbol: 'WETH',
					balance: 0.01,
					balanceUSD: 0.01 * 3500,
					address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
				},
			],
		},
		{
			network: NETWORKS[2],
			tokens: [
				{
					symbol: 'ETH',
					balance: 0.01,
					balanceUSD: 0.01 * 3500,
					address: '0x0000000000000000000000000000000000000000',
				},
				{
					symbol: 'SKYA',
					balance: 2.5,
					balanceUSD: 0.0097,
					address: '0x623cD3a3EdF080057892aaF8D773Bbb7A5C9b6e9',
				},
			],
		},
	],
	// Wallet B
	'0x44217a330d10c3607450364474249ed46579fdec': [
		{
			network: NETWORKS[0],
			tokens: [
				{
					symbol: 'ETH',
					balance: 0.08,
					balanceUSD: 0.08 * 3500,
					address: '0x0000000000000000000000000000000000000000',
				},
			],
		},
		{
			network: NETWORKS[1],
			tokens: [
				{
					symbol: 'ETH',
					balance: 0.04,
					balanceUSD: 0.04 * 3500,
					address: '0x0000000000000000000000000000000000000000',
				},
				{ symbol: 'USDC', balance: 10, balanceUSD: 10, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
				{
					symbol: 'WETH',
					balance: 0.01,
					balanceUSD: 0.01 * 3500,
					address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
				},
			],
		},
	],
};

export function mockAuraResponse(address: string): AuraResponse {
	const key = (address || '').toLowerCase();
	const portfolio = MOCK_WALLETS[key] || DEFAULT_ENTRIES;
	return {
		address,
		portfolio,
		cached: true,
		version: 'mock-simple-1',
	};
}
