import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';

if (!JWT_SECRET) {
	throw new Error('JWT_SECRET must be set in environment variables');
}

export interface JWTPayload {
	userId: string;
	walletAddress?: string;
	email?: string;
}

export function signJWT(payload: JWTPayload): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJWT(token: string): JWTPayload {
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		return decoded as JWTPayload;
	} catch {
		throw new Error('Invalid or expired JWT token');
	}
}

export async function verifyAuthToken(request: NextRequest): Promise<JWTPayload> {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new Error('No authorization token provided');
		}

		const token = authHeader.split(' ')[1];
		const payload = verifyJWT(token);

		return payload;
	} catch (error) {
		console.error('Error verifying auth token:', error);
		throw new Error('Invalid authentication token');
	}
}
