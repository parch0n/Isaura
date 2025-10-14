import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyToken } from '@/lib/privy-server';
import { User } from '@/models/User';
import { dbConnect } from '@/lib/mongoose';

export async function GET(request: NextRequest) {
	try {
		const { userId } = await verifyPrivyToken(request);

		await dbConnect();

		const user = await User.findOne({ privyUserId: userId });

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			wallets: user.wallets,
		});
	} catch (error) {
		console.error('Error in get addresses route:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
