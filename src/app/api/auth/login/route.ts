import { NextRequest, NextResponse } from 'next/server';
import { privy } from '@/lib/privyClient';
import { signJWT } from '@/lib/jwt';
import { dbConnect } from '@/lib/mongoose';
import { User } from '@/models/User';

export async function POST(request: NextRequest) {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
		}

		const privyToken = authHeader.split(' ')[1];
		const claims = await privy.verifyAuthToken(privyToken);
		const userId = claims.userId;
		const privyUser = await privy.getUser(userId);

		let walletAddress: string | undefined;
		let email: string | undefined;

		if (privyUser.wallet?.address) {
			walletAddress = privyUser.wallet.address;
		}
		if (privyUser.email?.address) {
			email = privyUser.email.address;
		}

		await dbConnect();

		let user = await User.findOne({ privyUserId: userId });
		if (!user) {
			try {
				user = await User.create({
					privyUserId: userId,
					lastLoginAt: new Date(),
					wallets: [],
				});
			} catch (createError: unknown) {
				// Handle duplicate key error (race condition)
				if (
					createError &&
					typeof createError === 'object' &&
					'code' in createError &&
					createError.code === 11000
				) {
					// User was created by another request, fetch it
					user = await User.findOne({ privyUserId: userId });
					if (!user) {
						throw new Error('User creation failed');
					}
				} else {
					throw createError;
				}
			}
		} else {
			user = await User.findOneAndUpdate({ privyUserId: userId }, { lastLoginAt: new Date() }, { new: true });
		}

		const jwtToken = signJWT({
			userId,
			walletAddress,
			email,
		});

		return NextResponse.json({
			success: true,
			token: jwtToken,
		});
	} catch (error) {
		console.error('Error in login route:', error);
		return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
	}
}
