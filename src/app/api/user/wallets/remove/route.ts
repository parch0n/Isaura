import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/jwt';
import { User } from '@/models/User';
import { dbConnect } from '@/lib/mongoose';
import { decryptWallets } from '@/lib/encryption';

export async function POST(request: NextRequest) {
	try {
		const { userId, walletAddress, email } = await verifyAuthToken(request);
		const { wallet } = await request.json();

		if (!wallet) {
			return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
		}

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
		const walletIndex = decryptedWallets.findIndex((w) => w === wallet);

		if (walletIndex === -1) {
			return NextResponse.json({ error: 'Wallet address not found' }, { status: 404 });
		}

		user.wallets.splice(walletIndex, 1);
		await user.save();

		const remainingDecryptedWallets = decryptWallets(user.wallets, encryptionKey);

		return NextResponse.json({
			success: true,
			wallets: remainingDecryptedWallets,
		});
	} catch (error) {
		console.error('Error in remove address route:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
