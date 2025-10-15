import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/jwt';
import { User } from '@/models/User';
import { dbConnect } from '@/lib/mongoose';
import { decryptWallets } from '@/lib/encryption';

export async function GET(request: NextRequest) {
	try {
		const { userId, walletAddress, email } = await verifyAuthToken(request);

		const encryptionKey = walletAddress || email;
		if (!encryptionKey) {
			return NextResponse.json({ error: 'Invalid JWT payload' }, { status: 400 });
		}

		await dbConnect();

		const user = await User.findOne({ privyUserId: userId });

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const decryptedWallets = decryptWallets(user.wallets, encryptionKey);

		return NextResponse.json({
			success: true,
			wallets: decryptedWallets,
		});
	} catch (error) {
		console.error('Error in get addresses route:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
