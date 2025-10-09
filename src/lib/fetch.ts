export function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
	return Promise.race([
		fetch(url, options),
		new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeout)),
	]);
}
