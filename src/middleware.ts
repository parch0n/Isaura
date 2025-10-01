import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
	const authToken = request.cookies.get('authToken');
	const isLoginPage = request.nextUrl.pathname === '/login';

	// If trying to access login page while logged in, redirect to home
	if (isLoginPage && authToken) {
		return NextResponse.redirect(new URL('/', request.url));
	}

	// If trying to access protected route without being logged in, redirect to login
	if (!isLoginPage && !authToken) {
		return NextResponse.redirect(new URL('/login', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/', '/login'],
};
