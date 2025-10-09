interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

class MemoryCache {
	private cache = new Map<string, CacheEntry<unknown>>();

	set<T>(key: string, data: T, ttlMs: number): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl: ttlMs,
		});
	}

	get<T>(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) return null;

		const now = Date.now();
		if (now - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			return null;
		}

		return entry.data as T;
	}

	delete(key: string): void {
		this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}

	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > entry.ttl) {
				this.cache.delete(key);
			}
		}
	}
}

export const portfolioCache = new MemoryCache();
export const strategiesCache = new MemoryCache();

if (typeof setInterval !== 'undefined') {
	setInterval(() => {
		portfolioCache.cleanup();
		strategiesCache.cleanup();
	}, 5 * 60 * 1000);
}
