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

export interface Platform {
	name: string;
	url: string;
}

export interface Action {
	tokens: string;
	description: string;
	platforms?: Platform[];
	networks?: string[];
	operations?: string[];
	apy?: string;
	flags?: string[];
}

export interface Strategy {
	name?: string;
	risk?: string;
	actions: Action[];
}

export interface StrategyWithWallet extends Strategy {
	walletAddress: string;
}

export interface StrategyLLM {
	provider: string;
	model: string;
}

export interface StrategyResponse {
	llm: StrategyLLM;
	response: Strategy[];
	responseTime: number;
	error: string | null;
	hash: string;
}

export interface AuraStrategiesResponse {
	address: string;
	strategies: StrategyResponse[];
	portfolio: AuraPortfolioEntry[];
	cached: boolean;
	version: string;
}

export interface StrategiesApiResponse {
	strategies: StrategyWithWallet[];
	byWallet: Record<string, Strategy[]>;
}
