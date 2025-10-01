import mongoose from 'mongoose';

const verificationCodeSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		trim: true,
		lowercase: true,
	},
	code: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: 600, // Document will be automatically deleted after 10 minutes
	},
});

export const VerificationCode =
	mongoose.models.VerificationCode || mongoose.model('VerificationCode', verificationCodeSchema);
