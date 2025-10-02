import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { User } from '@/models/User';
import { dbConnect } from '@/lib/mongoose';
import { fetchWithTimeout } from '@/lib/fetcher';
import { AuraResponse } from '@/types/aura';
import { mockAuraResponse } from '@/mocks/aura';

export async function GET() {
	try {
		const cookieStore = await cookies();
		const authToken = cookieStore.get('authToken')?.value;
		if (!authToken) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const decoded = jwt.verify(authToken, process.env.JWT_SECRET as string) as { email: string };

		await dbConnect();
		const user = await User.findOne({ email: decoded.email });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const wallets: string[] = Array.isArray(user.wallets) ? user.wallets : [];
		if (wallets.length === 0) {
			return NextResponse.json({ success: true, walletsCount: 0, tokens: [], addresses: [] });
		}

		const useMock = process.env.AURA_MOCK === 'true';
		const requests = wallets.map(async (addr) => {
			if (useMock) {
				const json = mockAuraResponse(addr);
				return { ok: true as const, addr, json };
			}
			try {
				const url = `https://aura.adex.network/api/portfolio/balances?address=${addr}`;
				const res = await fetchWithTimeout(url, { timeout: 20_000 });
				if (!res.ok) throw new Error(`Aura API error ${res.status}`);
				const json = (await res.json()) as AuraResponse;
				return { ok: true as const, addr, json };
			} catch (err) {
				return { ok: false as const, addr, err };
			}
		});

		const settled = await Promise.all(requests);

		const succeeded = settled.filter((r): r is { ok: true; addr: string; json: AuraResponse } => r.ok);

		// Aggregate by token symbol and collect representative contract addresses per chain for logo resolution
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

		for (const { json } of succeeded) {
			if (!json?.portfolio) continue;
			for (const entry of json.portfolio) {
				const networkName = entry.network?.name || entry.network?.platformId || 'unknown';
				const chainId = entry.network?.chainId || '';
				for (const tok of entry.tokens || []) {
					if (!tok?.symbol) continue;
					const key = tok.symbol.trim();
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
			// Handle native coin (zero address or 0xeeee... placeholders) using chain info logo
			const lower = address.toLowerCase();
			if (
				lower === '0x0000000000000000000000000000000000000000' ||
				lower === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
			) {
				return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${slug}/info/logo.png`;
			}
			// Uses TrustWallet assets repository raw URL; expects checksummed address
			return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${slug}/assets/${address}/logo.png`;
		}

		const tokens = Array.from(aggMap.values())
			.map((t) => {
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
			})
			.sort((a, b) => b.totalUSD - a.totalUSD);

		return NextResponse.json({
			success: true,
			walletsCount: wallets.length,
			addresses: wallets,
			tokens,
		});
	} catch (error) {
		console.error('Error in portfolio summary route:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
