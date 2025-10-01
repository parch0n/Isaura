import nodemailer from 'nodemailer';

if (
	!process.env.EMAIL_SERVER_HOST ||
	!process.env.EMAIL_SERVER_PORT ||
	!process.env.EMAIL_SERVER_USER ||
	!process.env.EMAIL_SERVER_PASSWORD
) {
	throw new Error('Email configuration is missing in .env.local');
}

export const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_SERVER_HOST,
	port: parseInt(process.env.EMAIL_SERVER_PORT),
	secure: true,
	auth: {
		user: process.env.EMAIL_SERVER_USER,
		pass: process.env.EMAIL_SERVER_PASSWORD,
	},
	tls: {
		rejectUnauthorized: false, // During development only!
	},
});

export const sendVerificationEmail = async (email: string, code: string) => {
	const mailOptions = {
		from: `"Aura Hackathon" ${process.env.EMAIL_SERVER_USER}`,
		to: email,
		subject: 'Your verification code',
		text: `Your verification code is: ${code}`,
		html: `
      <h1>Your verification code</h1>
      <p>Use this code to verify your email: <strong>${code}</strong></p>
      <p>This code will expire in 10 minutes.</p>
    `,
	};

	await transporter.sendMail(mailOptions);
};
