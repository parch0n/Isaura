import { NextResponse } from 'next/server';
import { User } from '@/models/User';
import { dbConnect } from '@/lib/mongoose';

export async function POST(request: Request) {
	try {
		const { privyUserId, email } = await request.json();

		if (!privyUserId) {
			return NextResponse.json({ error: 'Privy user ID is required' }, { status: 400 });
		}

		await dbConnect();

		let user = await User.findOne({ privyUserId });
		if (!user) {
			const userData: {
				privyUserId: string;
				lastLoginAt: Date;
				email?: string;
				wallets?: string[];
			} = {
				privyUserId,
				lastLoginAt: new Date(),
				wallets: [],
			};

			if (email) {
				userData.email = email;
			}

			try {
				user = await User.create(userData);
			} catch (createError: unknown) {
				// Handle duplicate key error
				if (
					createError &&
					typeof createError === 'object' &&
					'code' in createError &&
					createError.code === 11000
				) {
					// User was created by another request, fetch it
					user = await User.findOne({ privyUserId });
					if (!user) {
						throw new Error('User creation failed');
					}
				} else {
					throw createError;
				}
			}
		} else {
			// User already exists, just update last login time
			user = await User.findOneAndUpdate({ privyUserId }, { lastLoginAt: new Date() }, { new: true });
		}

		return NextResponse.json({
			success: true,
			user: {
				id: user._id,
				privyUserId: user.privyUserId,
				email: user.email,
				wallets: user.wallets,
			},
		});
	} catch (error) {
		console.error('Error syncing user with Privy:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Internal server error' },
			{ status: 500 }
		);
	}
}
