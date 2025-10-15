import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/jwt';
import { User } from '@/models/User';
import { dbConnect } from '@/lib/mongoose';
import { fetchWithTimeout } from '@/lib/fetch';
import { AuraResponse } from '@/types/aura';
import { mockAuraResponse } from '@/mocks/aura';
import { portfolioCache } from '@/lib/cache';
import { decryptWallets } from '@/lib/encryption';

const CACHE_TTL = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
	try {
		const { userId, walletAddress, email } = await verifyAuthToken(request);

		const encryptionKey = walletAddress || email;
		if (!encryptionKey) {
			return NextResponse.json({ error: 'Invalid JWT payload' }, { status: 400 });
		}

		await dbConnect();
		const user = await User.findOne({ privyUserId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const encryptedWallets: string[] = Array.isArray(user.wallets) ? user.wallets : [];
		if (encryptedWallets.length === 0) {
			return NextResponse.json({ success: true, walletsCount: 0, tokens: [], addresses: [] });
		}

		const wallets = decryptWallets(encryptedWallets, encryptionKey);

		const cacheKey = `portfolio:${userId}:${wallets.sort().join(',')}`;
		const cached = portfolioCache.get(cacheKey);
		if (cached) {
			return NextResponse.json(cached);
		}

		const useMock = process.env.AURA_MOCK === 'true';
		const requests = wallets.map(async (addr) => {
			if (useMock) {
				const json = mockAuraResponse(addr);
				return { ok: true as const, addr, json };
			}
			try {
				const url = `https://aura.adex.network/api/portfolio/balances?address=${addr}&apiKey=${process.env.AURA_API_KEY}`;
				const res = await fetchWithTimeout(url, {}, 120000);
				if (!res.ok) throw new Error(`Aura API error ${res.status}`);
				const json = (await res.json()) as AuraResponse;
				return { ok: true as const, addr, json };
			} catch (err) {
				return { ok: false as const, addr, err };
			}
		});

		const settled = await Promise.all(requests);

		const succeeded = settled.filter((r): r is { ok: true; addr: string; json: AuraResponse } => r.ok);

		const aggMap = new Map<
			string,
			{
				symbol: string;
				total: number;
				totalUSD: number;
				networks: Set<string>;
				addressesByChainId: Map<string, string>;
			}
		>();

		const perWalletMap = new Map<
			string,
			Map<
				string,
				{
					symbol: string;
					total: number;
					totalUSD: number;
					networks: Set<string>;
					addressesByChainId: Map<string, string>;
				}
			>
		>();

		for (const { json, addr: walletAddr } of succeeded) {
			if (!json?.portfolio) continue;
			if (!perWalletMap.has(walletAddr)) perWalletMap.set(walletAddr, new Map());
			const walletMap = perWalletMap.get(walletAddr)!;
			for (const entry of json.portfolio) {
				const networkName = entry.network?.name || entry.network?.platformId || 'unknown';
				const chainId = entry.network?.chainId || '';
				for (const tok of entry.tokens || []) {
					if (!tok?.symbol) continue;
					const key = tok.symbol.trim();

					if (key === 'ETH' && tok.address && tok.address !== '0x0000000000000000000000000000000000000000') {
						continue;
					}

					if (!aggMap.has(key)) {
						aggMap.set(key, {
							symbol: key,
							total: 0,
							totalUSD: 0,
							networks: new Set<string>(),
							addressesByChainId: new Map<string, string>(),
						});
					}
					const cur = aggMap.get(key)!;
					cur.total += Number(tok.balance || 0);
					cur.totalUSD += Number(tok.balanceUSD || 0);
					cur.networks.add(networkName);
					if (chainId && tok.address && !cur.addressesByChainId.has(chainId)) {
						cur.addressesByChainId.set(chainId, tok.address);
					}

					if (!walletMap.has(key)) {
						walletMap.set(key, {
							symbol: key,
							total: 0,
							totalUSD: 0,
							networks: new Set<string>(),
							addressesByChainId: new Map<string, string>(),
						});
					}
					const wcur = walletMap.get(key)!;
					wcur.total += Number(tok.balance || 0);
					wcur.totalUSD += Number(tok.balanceUSD || 0);
					wcur.networks.add(networkName);
					if (chainId && tok.address && !wcur.addressesByChainId.has(chainId)) {
						wcur.addressesByChainId.set(chainId, tok.address);
					}
				}
			}
		}

		// Map common EVM chainIds to TrustWallet blockchain slugs
		const chainIdToTW: Record<string, string> = {
			'1': 'ethereum',
			'137': 'polygon',
			'42161': 'arbitrum',
			'10': 'optimism',
			'8453': 'base',
			'56': 'smartchain',
			'43114': 'avalanche',
			'250': 'fantom',
			'100': 'gnosis',
			'42220': 'celo',
			'25': 'cronos',
		};

		const preferredChains = ['1', '137', '42161', '10', '8453', '56', '43114'];

		function buildLogoURI(chainId: string, address: string): string | null {
			const slug = chainIdToTW[chainId];
			if (!slug || !address) return null;

			const lower = address.toLowerCase();
			if (
				lower === '0x0000000000000000000000000000000000000000' ||
				lower === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
			) {
				return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${slug}/info/logo.png`;
			}

			return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${slug}/assets/${address}/logo.png`;
		}

		function mapToTokensArray(
			m: Map<
				string,
				{
					symbol: string;
					total: number;
					totalUSD: number;
					networks: Set<string>;
					addressesByChainId: Map<string, string>;
				}
			>
		) {
			return Array.from(m.values()).map((t) => {
				// Pick a representative logo by preferred chain order, else first available
				let logoURI: string | null = null;
				for (const cid of preferredChains) {
					const addr = t.addressesByChainId.get(cid);
					if (addr) {
						logoURI = buildLogoURI(cid, addr);
						if (logoURI) break;
					}
				}
				if (!logoURI) {
					for (const [cid, addr] of t.addressesByChainId.entries()) {
						const maybe = buildLogoURI(cid, addr);
						if (maybe) {
							logoURI = maybe;
							break;
						}
					}
				}
				return {
					symbol: t.symbol,
					total: t.total,
					totalUSD: t.totalUSD,
					networks: Array.from(t.networks),
					logoURI: logoURI ?? undefined,
				};
			});
		}

		const tokens = mapToTokensArray(aggMap).sort((a, b) => b.totalUSD - a.totalUSD);

		const byWallet: Record<
			string,
			Array<{ symbol: string; total: number; totalUSD: number; networks: string[]; logoURI?: string }>
		> = {};
		for (const [addr, wmap] of perWalletMap.entries()) {
			byWallet[addr] = mapToTokensArray(wmap).sort((a, b) => b.totalUSD - a.totalUSD);
		}

		const response = {
			success: true,
			walletsCount: wallets.length,
			addresses: wallets,
			tokens,
			byWallet,
		};

		portfolioCache.set(cacheKey, response, CACHE_TTL);
		return NextResponse.json(response);
	} catch (error) {
		console.error('Error in portfolio summary route:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
