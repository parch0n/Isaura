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
			user = await User.create({
				privyUserId: userId,
				wallets: [],
			});
		}

		const jwtToken = signJWT({
			userId,
			walletAddress,
			email,
		});

		return NextResponse.json({
			success: true,
			token: jwtToken,
			user: {
				id: user._id,
				privyUserId: user.privyUserId,
			},
		});
	} catch (error) {
		console.error('Error in login route:', error);
		return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
	}
}
