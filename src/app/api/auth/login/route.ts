import { NextResponse } from 'next/server';
import { User } from '@/models/User';
import { VerificationCode } from '@/models/VerificationCode';
import { sendVerificationEmail } from '@/lib/email';
import { dbConnect } from '@/lib/mongoose';

function generateCode() {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
	try {
		const { email } = await request.json();

		if (!email) {
			return NextResponse.json({ error: 'Email is required' }, { status: 400 });
		}

		// Connect to MongoDB
		await dbConnect();

		// Find or create user
		let user = await User.findOne({ email });
		console.log(user);
		if (!user) {
			console.log('Creating user');
			user = await User.create({ email });
		}

		// Delete any existing verification codes for this email
		await VerificationCode.deleteMany({ email });

		// Generate and save new verification code
		const code = generateCode();

		// Send verification email and save new code
		try {
			await sendVerificationEmail(email, code);
			await VerificationCode.create({ email, code });
		} catch (emailError) {
			console.error('Error sending email:', emailError);
			return NextResponse.json(
				{ error: 'Failed to send verification email. Please try again.' },
				{ status: 500 }
			);
		}

		return NextResponse.json({ message: 'Verification code sent' });
	} catch (error) {
		console.error('Error in login route:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Internal server error' },
			{ status: 500 }
		);
	}
}
