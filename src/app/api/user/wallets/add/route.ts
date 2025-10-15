import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/jwt';
import { User } from '@/models/User';
import { dbConnect } from '@/lib/mongoose';
import { encryptWallet, decryptWallets } from '@/lib/encryption';

export async function POST(request: NextRequest) {
	try {
		const { userId, walletAddress, email } = await verifyAuthToken(request);
		const { wallet } = await request.json();

		if (!wallet) {
			return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
		}

		if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
			return NextResponse.json({ error: 'Invalid EVM address format' }, { status: 400 });
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
		if (decryptedWallets.includes(wallet)) {
			return NextResponse.json({ error: 'Wallet address already exists' }, { status: 400 });
		}
		if (user.wallets.length >= 10) {
			return NextResponse.json({ error: 'Maximum number of wallets (10) reached' }, { status: 400 });
		}

		const encryptedWallet = encryptWallet(wallet, encryptionKey);
		user.wallets.push(encryptedWallet);
		await user.save();

		return NextResponse.json({
			success: true,
			wallets: decryptedWallets.concat([wallet]),
		});
	} catch (error) {
		console.error('Error in add address route:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
