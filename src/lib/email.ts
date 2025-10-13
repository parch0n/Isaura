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
			<div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f9f9fb; padding: 32px; border-radius: 8px; max-width: 480px; margin: auto; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
				<h2 style="color: #3b82f6; margin-bottom: 16px;">isAura Email Verification</h2>
				<p style="font-size: 16px; color: #222;">Hello,</p>
				<p style="font-size: 16px; color: #222;">Please use the code below to verify your email address:</p>
				<div style="background: #e0e7ff; color: #3730a3; font-size: 28px; font-weight: bold; letter-spacing: 2px; padding: 16px 0; border-radius: 6px; text-align: center; margin: 24px 0;">
					${code}
				</div>
				<p style="font-size: 14px; color: #555;">This code will expire in 10 minutes.</p>
				<hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
				<p style="font-size: 12px; color: #888;">If you did not request this, you can safely ignore this email.</p>
				<p style="font-size: 12px; color: #888; margin-top: 8px;">&copy; ${new Date().getFullYear()} isAura</p>
			</div>
		`,
	});
};
