import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyToken } from '@/lib/privy-server';
import { User } from '@/models/User';
import { dbConnect } from '@/lib/mongoose';

export async function POST(request: NextRequest) {
	try {
		const { userId } = await verifyPrivyToken(request);
		const { wallet } = await request.json();

		if (!wallet) {
			return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
		}

		await dbConnect();

		const user = await User.findOne({ privyUserId: userId });

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		if (!user.wallets.includes(wallet)) {
			return NextResponse.json({ error: 'Wallet address not found' }, { status: 404 });
		}

		user.wallets = user.wallets.filter((addr: string) => addr !== wallet);
		await user.save();

		return NextResponse.json({
			success: true,
			wallets: user.wallets,
		});
	} catch (error) {
		console.error('Error in remove address route:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
