import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { User } from '@/models/User';
import { dbConnect } from '@/lib/mongoose';
import { fetchWithTimeout } from '@/lib/fetcher';
import { AuraResponse } from '@/types/aura';

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

		const requests = wallets.map(async (addr) => {
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

		const aggMap = new Map<string, { symbol: string; total: number; totalUSD: number; networks: Set<string> }>();

		for (const { json } of succeeded) {
			if (!json?.portfolio) continue;
			for (const entry of json.portfolio) {
				const networkName = entry.network?.name || entry.network?.platformId || 'unknown';
				for (const tok of entry.tokens || []) {
					if (!tok?.symbol) continue;
					const key = tok.symbol.trim();
					if (!aggMap.has(key)) {
						aggMap.set(key, { symbol: key, total: 0, totalUSD: 0, networks: new Set<string>() });
					}
					const cur = aggMap.get(key)!;
					cur.total += Number(tok.balance || 0);
					cur.totalUSD += Number(tok.balanceUSD || 0);
					cur.networks.add(networkName);
				}
			}
		}

		const tokens = Array.from(aggMap.values())
			.map((t) => ({ symbol: t.symbol, total: t.total, totalUSD: t.totalUSD, networks: Array.from(t.networks) }))
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
