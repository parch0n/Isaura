import OpenAI from 'openai';
import type { Strategy } from '@/types/aura';

const openai = process.env.OPENAI_API_KEY
	? new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
	  })
	: null;

export async function filterCombinedStrategies(strategiesByWallet: Record<string, Strategy[]>): Promise<Strategy[]> {
	const walletCount = Object.keys(strategiesByWallet).length;

	if (walletCount <= 1) {
		console.log('Only one wallet found, skipping AI filtering');
		const allStrategies: Strategy[] = [];
		Object.values(strategiesByWallet).forEach((strategies) => {
			allStrategies.push(...strategies);
		});
		return allStrategies;
	}

	if (!openai) {
		console.warn('OpenAI API key not configured, returning all strategies');
		const allStrategies: Strategy[] = [];
		Object.values(strategiesByWallet).forEach((strategies) => {
			allStrategies.push(...strategies);
		});

		return allStrategies;
	}

	try {
		const allStrategies: (Strategy & { walletSource?: string })[] = [];
		Object.entries(strategiesByWallet).forEach(([wallet, strategies]) => {
			strategies.forEach((strategy) => {
				allStrategies.push({
					...strategy,
					walletSource: wallet.slice(0, 6) + '...' + wallet.slice(-4),
				});
			});
		});

		if (allStrategies.length === 0) {
			return [];
		}

		const prompt = `
            You are a DeFi portfolio strategy analyzer. I have collected strategies from multiple wallets and need you to filter out obsolete/redundant ones.

            ALL STRATEGIES FROM ALL WALLETS:
            ${JSON.stringify(allStrategies, null, 2)}

            TASK:
            1. Identify redundant strategies across wallets (e.g., if one wallet suggests "deposit ETH" but another wallet already has ETH positions)
            2. Remove obsolete strategies that don't make sense when considering the entire portfolio
            3. Keep only the most relevant and non-redundant strategies
            4. Preserve the EXACT original strategy structure - do not modify the strategy content, only filter which ones to keep
			5. Remove "Top up wallet" strategy if there are funds in the other wallets

            IMPORTANT: 
            - Return the EXACT strategies from the input (same structure, same text, same everything)
            - Only remove redundant/obsolete ones, don't create new strategies
            - If multiple similar strategies exist, keep the most comprehensive one
            - Preserve all original fields exactly as they were

            OUTPUT FORMAT (JSON only, no additional text):
            {
            "strategies": [
                // Include EXACT original strategy objects that should be kept
            ]
            }
        `;

		const completion = await openai.chat.completions.create({
			model: 'gpt-5-mini',
			messages: [
				{
					role: 'system',
					content:
						'You are a strategy filter. Return only the exact original strategies that should be kept, removing only redundant/obsolete ones. Do not modify strategy content.',
				},
				{
					role: 'user',
					content: prompt,
				},
			],
			max_completion_tokens: 3000,
		});

		const responseContent = completion.choices[0]?.message?.content;
		if (!responseContent) {
			throw new Error('No response from OpenAI');
		}

		const parsedResponse = JSON.parse(responseContent);
		const filteredStrategies = parsedResponse.strategies || [];

		return filteredStrategies.map((strategy: Strategy & { walletSource?: string }) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { walletSource, ...cleanStrategy } = strategy;
			return cleanStrategy;
		});
	} catch (error) {
		console.error('Error filtering combined strategies:', error);
		const allStrategies: Strategy[] = [];
		Object.values(strategiesByWallet).forEach((strategies) => {
			allStrategies.push(...strategies);
		});

		return allStrategies;
	}
}
