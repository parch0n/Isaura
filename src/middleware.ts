import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
	const isLoginPage = request.nextUrl.pathname === '/login';

	const cookies = request.cookies.getAll();
	const hasPrivyCookies = cookies.some(
		(cookie) => cookie.name.includes('privy') || cookie.name.includes('authToken')
	);

	if (isLoginPage && hasPrivyCookies) {
		const authCookie = cookies.find(
			(cookie) => cookie.name.includes('token') && cookie.value && cookie.value.length > 20
		);

		if (authCookie) {
			return NextResponse.redirect(new URL('/', request.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/login'],
};
