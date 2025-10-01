import { NextResponse } from 'next/server';
import { User } from '@/models/User';
import { VerificationCode } from '@/models/VerificationCode';
import jwt from 'jsonwebtoken';
import { dbConnect } from '@/lib/mongoose';

if (!process.env.JWT_SECRET) {
	throw new Error('JWT_SECRET is not defined in .env.local');
}

export async function POST(request: Request) {
	try {
		const { email, code } = await request.json();

		if (!email || !code) {
			return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
		}

		// Connect to MongoDB
		await dbConnect();

		// Find the verification code
		const verificationCode = await VerificationCode.findOne({
			email,
			code,
			createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) }, // Code must be less than 10 minutes old
		});

		if (!verificationCode) {
			return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
		}

		// Update user
		await User.updateOne(
			{ email },
			{
				$set: {
					emailVerified: true,
					lastLoginAt: new Date(),
				},
			}
		);

		// Delete the used verification code
		await VerificationCode.deleteOne({ _id: verificationCode._id });

		// Generate JWT token
		const token = jwt.sign({ email }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

		// Set the token in a HTTP-only cookie
		const response = NextResponse.json({ success: true });
		response.cookies.set('authToken', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 7 * 24 * 60 * 60, // 7 days
			path: '/', // Add this to ensure the cookie is available for all paths
		});

		return response;
	} catch (error) {
		console.error('Error in verify route:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
