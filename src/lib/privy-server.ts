import { PrivyClient } from '@privy-io/server-auth';
import { NextRequest } from 'next/server';

if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID || !process.env.PRIVY_APP_SECRET) {
	throw new Error('NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET must be set in environment variables');
}

const privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);

export async function verifyPrivyToken(request: NextRequest) {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new Error('No authorization token provided');
		}

		const token = authHeader.split(' ')[1];
		const claims = await privy.verifyAuthToken(token);

		return {
			userId: claims.userId,
			appId: claims.appId, // remove
		};
	} catch (error) {
		console.error('Error verifying Privy token:', error);
		throw new Error('Invalid authentication token');
	}
}

export { privy };
