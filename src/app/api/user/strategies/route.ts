import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { dbConnect } from '@/lib/mongoose';
import { User } from '@/models/User';
import { strategiesCache } from '@/lib/cache';
import { fetchWithTimeout } from '@/lib/fetch';
import { mockAuraStrategiesResponse } from '@/mocks/aura';
import { filterCombinedStrategies } from '@/lib/prompt';
import type { Strategy, AuraStrategiesResponse, StrategiesApiResponse } from '@/types/aura';

const CACHE_TTL = 60 * 60 * 1000;

export async function GET() {
	try {
		const cookieStore = await cookies();
		const authToken = cookieStore.get('authToken')?.value;

		if (!authToken) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const decoded = jwt.verify(authToken, process.env.JWT_SECRET as string) as {
			email: string;
		};

		await dbConnect();
		const user = await User.findOne({ email: decoded.email });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const wallets: string[] = Array.isArray(user.wallets) ? user.wallets : [];
		if (wallets.length === 0) {
			return NextResponse.json({ byWallet: {}, combined: [] });
		}

		const cacheKey = `strategies_${wallets.sort().join('_')}`;
		const cached = strategiesCache.get<{
			byWallet: Record<string, Strategy[]>;
			combined: Strategy[];
		}>(cacheKey);
		if (cached) {
			return NextResponse.json(cached);
		}

		const strategiesByWallet: Record<string, Strategy[]> = {};

		const useMock = process.env.AURA_MOCK === 'true';
		for (const wallet of wallets) {
			try {
				let strategiesData: AuraStrategiesResponse;

				if (useMock) {
					strategiesData = mockAuraStrategiesResponse(wallet);
				} else {
					const auraUrl = `https://aura.adex.network/api/portfolio/strategies?address=${wallet}&apiKey=${process.env.AURA_API_KEY}`;
					console.log('Fetching strategies from Aura API:', auraUrl);

					const response = await fetchWithTimeout(auraUrl, {}, 15000);

					if (!response.ok) {
						console.error('Aura API error for wallet', wallet, response.status, response.statusText);
						continue;
					}

					strategiesData = await response.json();
				}

				const walletStrategies: Strategy[] = strategiesData.strategies?.[0]?.response || [];

				strategiesByWallet[wallet] = walletStrategies;
			} catch (error) {
				console.error('Error fetching strategies for wallet', wallet, error);
				strategiesByWallet[wallet] = [];
			}
		}

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
