export type AuraToken = {
	symbol: string;
	balance: number;
	balanceUSD: number;
	address: string;
};

export type AuraNetwork = {
	name: string;
	chainId: string;
	platformId: string;
	explorerUrl?: string;
	iconUrls?: string[];
};

export type AuraPortfolioEntry = {
	network: AuraNetwork;
	tokens: AuraToken[];
};

export type AuraResponse = {
	address: string;
	portfolio: AuraPortfolioEntry[];
	cached: boolean;
	version: string;
};
