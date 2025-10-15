import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/jwt';
import { dbConnect } from '@/lib/mongoose';
import { User } from '@/models/User';
import { strategiesCache } from '@/lib/cache';
import { fetchWithTimeout } from '@/lib/fetch';
import { mockAuraStrategiesResponse } from '@/mocks/aura';
import { filterCombinedStrategies } from '@/lib/prompt';
import type { Strategy, AuraStrategiesResponse, StrategiesApiResponse } from '@/types/aura';

const CACHE_TTL = 60 * 60 * 1000;

export async function GET(request: NextRequest) {
	try {
		const { userId } = await verifyAuthToken(request);

		await dbConnect();
		const user = await User.findOne({ privyUserId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const wallets: string[] = Array.isArray(user.wallets) ? user.wallets : [];
		if (wallets.length === 0) {
			return NextResponse.json({ byWallet: {}, combined: [] });
		}

		const cacheKey = `strategies:${userId}:${wallets.sort().join(',')}`;
		const cached = strategiesCache.get<{
			byWallet: Record<string, Strategy[]>;
			combined: Strategy[];
		}>(cacheKey);
		if (cached) {
			return NextResponse.json(cached);
		}

		const useMock = process.env.AURA_MOCK === 'true';

		const requests = wallets.map(async (wallet) => {
			try {
				let strategiesData: AuraStrategiesResponse;

				if (useMock) {
					strategiesData = mockAuraStrategiesResponse(wallet);
				} else {
					const auraUrl = `https://aura.adex.network/api/portfolio/strategies?address=${wallet}&apiKey=${process.env.AURA_API_KEY}`;
					console.log('Fetching strategies from Aura API:', auraUrl);
					const response = await fetchWithTimeout(auraUrl, {}, 120000);
					if (!response.ok) {
						throw new Error(`Aura API error ${response.status} ${response.statusText}`);
					}
					strategiesData = (await response.json()) as AuraStrategiesResponse;
				}

				const walletStrategies: Strategy[] = strategiesData.strategies?.[0]?.response || [];
				return { wallet, strategies: walletStrategies };
			} catch (error) {
				console.error('Error fetching strategies for wallet', wallet, error);
				return { wallet, strategies: [] as Strategy[] };
			}
		});

		const results = await Promise.all(requests);
		const strategiesByWallet: Record<string, Strategy[]> = Object.fromEntries(
			results.map((r) => [r.wallet, r.strategies])
		);

		const combinedStrategies = await filterCombinedStrategies(strategiesByWallet);

		const result: StrategiesApiResponse = {
			byWallet: strategiesByWallet,
			combined: combinedStrategies,
		};

		strategiesCache.set(cacheKey, result, CACHE_TTL);

		return NextResponse.json(result);
	} catch (error) {
		console.error('Strategies API error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
