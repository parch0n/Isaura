import { AuraResponse, AuraPortfolioEntry, AuraNetwork } from '@/types/aura';

const networks: AuraNetwork[] = [
	{ name: 'Ethereum', chainId: '1', platformId: 'ethereum', explorerUrl: 'https://etherscan.io' },
	{ name: 'Arbitrum One', chainId: '42161', platformId: 'arbitrum', explorerUrl: 'https://arbiscan.io' },
	{ name: 'Base', chainId: '8453', platformId: 'base', explorerUrl: 'https://basescan.org' },
];

export function mockAuraResponse(address: string): AuraResponse {
	const entries: AuraPortfolioEntry[] = [
		{
			network: networks[0],
			tokens: [
				// Native ETH
				{
					symbol: 'ETH',
					balance: 0.15,
					balanceUSD: 0.15 * 3500,
					address: '0x0000000000000000000000000000000000000000',
				},
				// WETH
				{
					symbol: 'WETH',
					balance: 0.03,
					balanceUSD: 0.03 * 3500,
					address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
				},
				// USDC
				{
					symbol: 'USDC',
					balance: 50,
					balanceUSD: 50,
					address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
				},
				// WBTC
				{
					symbol: 'WBTC',
					balance: 0.002,
					balanceUSD: 0.002 * 65000,
					address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
				},
			],
		},
		{
			network: networks[1],
			tokens: [
				{
					symbol: 'ETH',
					balance: 0.08,
					balanceUSD: 0.08 * 3500,
					address: '0x0000000000000000000000000000000000000000',
				},
				{
					symbol: 'WETH',
					balance: 0.015,
					balanceUSD: 0.015 * 3500,
					address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
				},
				{
					symbol: 'USDC',
					balance: 20,
					balanceUSD: 20,
					address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
				},
			],
		},
		{
			network: networks[2],
			tokens: [
				{
					symbol: 'ETH',
					balance: 0.04,
					balanceUSD: 0.04 * 3500,
					address: '0x0000000000000000000000000000000000000000',
				},
				{
					symbol: 'USDC',
					balance: 10,
					balanceUSD: 10,
					address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
				},
				// Example custom token like SKYA
				{
					symbol: 'SKYA',
					balance: 1.052,
					balanceUSD: 0.00406849428,
					address: '0x623cD3a3EdF080057892aaF8D773Bbb7A5C9b6e9',
				},
			],
		},
	];

	return {
		address,
		portfolio: entries,
		cached: true,
		version: 'mock-1',
	};
}
