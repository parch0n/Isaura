import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { User } from '@/models/User';
import { dbConnect } from '@/lib/mongoose';

export async function POST(request: Request) {
	try {
		// Get the auth token
		const cookieStore = await cookies();
		const authToken = cookieStore.get('authToken')?.value;

		if (!authToken) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Verify the token
		const decoded = jwt.verify(authToken, process.env.JWT_SECRET as string) as { email: string };

		// Get the address from request body
		const { wallet } = await request.json();

		if (!wallet) {
			return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
		}

		await dbConnect();

		// Get user
		const user = await User.findOne({ email: decoded.email });

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Check if address exists
		if (!user.wallets.includes(wallet)) {
			return NextResponse.json({ error: 'Wallet address not found' }, { status: 404 });
		}

		// Remove the address
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
