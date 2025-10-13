import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
	throw new Error('Resend API key is missing in .env.local');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, code: string) => {
	await resend.emails.send({
		from: 'isAura Admin <onboarding@resend.dev>',
		to: email,
		subject: 'Your verification code',
		text: `Your verification code is: ${code}`,
		html: `
			<h1>Your verification code</h1>
			<p>Use this code to verify your email: <strong>${code}</strong></p>
			<p>This code will expire in 10 minutes.</p>
		`,
	});
};
