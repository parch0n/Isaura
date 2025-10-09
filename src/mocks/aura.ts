import { AuraResponse, AuraPortfolioEntry, AuraNetwork, AuraStrategiesResponse } from '@/types/aura';

const NETWORKS: AuraNetwork[] = [
	{ name: 'Ethereum', chainId: '1', platformId: 'ethereum', explorerUrl: 'https://etherscan.io' },
	{ name: 'Arbitrum One', chainId: '42161', platformId: 'arbitrum', explorerUrl: 'https://arbiscan.io' },
	{ name: 'Base', chainId: '8453', platformId: 'base', explorerUrl: 'https://basescan.org' },
];

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

export function mockAuraStrategiesResponse(address: string): AuraStrategiesResponse {
	return {
		address,
		strategies: [
			{
				llm: {
					provider: 'AdEx Aura',
					model: 'adex-aura-0.2',
				},
				response: [
					{
						name: 'Hold and Monitor ETH (Base)',
						risk: 'low',
						actions: [
							{
								tokens: 'ETH',
								description:
									'Hold your ETH on Base as it continues to show positive price momentum and network growth. No action is required; monitor market trends and Base network expansion. Consider dollar-cost averaging to steadily grow your position if more capital becomes available.',
								platforms: [],
								networks: ['base'],
								operations: ['holding'],
								apy: 'N/A',
								flags: ['coingecko'],
							},
						],
					},
					{
						name: 'Stake ETH for Passive Yield',
						risk: 'low',
						actions: [
							{
								tokens: 'ETH',
								description:
									'Stake your ETH on a mainnet protocol like Lido, Rocket Pool, or StakeWise to earn passive rewards (2.4–2.7% APY). Due to current L2 limitations, staking directly on Base is not possible, so bridging your ETH to Ethereum mainnet might be required for staking. Use official protocol sites to avoid scams.',
								platforms: [
									{ name: 'Lido', url: 'https://stake.lido.fi/' },
									{ name: 'Rocket Pool', url: 'https://stake.rocketpool.net' },
									{ name: 'StakeWise', url: 'https://app.stakewise.io' },
								],
								networks: ['ethereum'],
								operations: ['staking'],
								apy: '2.4-2.7%',
								flags: [],
							},
						],
					},
					{
						name: 'Deposit ETH as Collateral on Aave (Base)',
						risk: 'moderate',
						actions: [
							{
								tokens: 'ETH',
								description:
									'Deposit your ETH on Aave Base to earn yield and optionally borrow stablecoins against it. This increases capital efficiency but introduces risk of liquidation if ETH price drops sharply. APY fluctuates (typically 1-2% for supply side). Only use reputable lending protocols.',
								platforms: [{ name: 'Aave', url: 'https://app.aave.com' }],
								networks: ['base'],
								operations: ['lending'],
								apy: '~1-2%',
								flags: [],
							},
						],
					},
					{
						name: 'Provide ETH Liquidity on Uniswap or Curve (Base)',
						risk: 'high',
						actions: [
							{
								tokens: 'ETH',
								description:
									'Provide your ETH as liquidity to a DEX like Uniswap or Curve (if supported on Base). Earn trading fees and (incentivized pools) possibly extra tokens. Be aware of impermanent loss from price divergence. Use official DEX frontends for maximum safety.',
								platforms: [
									{ name: 'Uniswap', url: 'https://app.uniswap.org' },
									{ name: 'Curve', url: 'https://curve.finance' },
								],
								networks: ['base'],
								operations: ['liquidity provision'],
								apy: 'Variable (N/A)',
								flags: [],
							},
						],
					},
					{
						name: 'Opportunistic Yield Farming on Uniswap or SushiSwap (Base, if available)',
						risk: 'opportunistic',
						actions: [
							{
								tokens: 'ETH',
								description:
									'If available on Base, enter yield farming pools with your ETH to earn extra rewards (new tokens/incentives). Yields may be high initially but are volatile and subject to both market risk and possible smart contract risk. Only allocate capital you can afford to lose and monitor rewards closely.',
								platforms: [
									{ name: 'Uniswap', url: 'https://app.uniswap.org' },
									{ name: 'SushiSwap', url: 'https://www.sushi.com' },
								],
								networks: ['base'],
								operations: ['yield farming'],
								apy: 'Variable (N/A)',
								flags: [],
							},
						],
					},
				],
				responseTime: 21.732743767,
				error: null,
				hash: '54d7a6d097796d34eab32c5d1ad2022989fbfb80e583b15ecbcdb740d3ba572c',
			},
		],
		portfolio: [
			{
				network: {
					name: 'Base',
					chainId: '8453',
					platformId: 'base',
					explorerUrl: 'https://basescan.org',
					iconUrls: [],
				},
				tokens: [
					{
						symbol: 'ETH',
						balance: 0.006637605083850375,
						balanceUSD: 28.866546253360248,
						address: '0x0000000000000000000000000000000000000000',
					},
				],
			},
		],
		cached: true,
		version: '0.3.9',
	};
}
