export async function fetchWithTimeout(resource: string, options: RequestInit & { timeout?: number } = {}) {
	const { timeout = 15_000, ...init } = options;
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);
	try {
		const res = await fetch(resource, { ...init, signal: controller.signal, cache: 'no-store' });
		return res;
	} finally {
		clearTimeout(id);
	}
}
