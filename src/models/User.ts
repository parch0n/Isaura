import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
	privyUserId: {
		type: String,
		unique: true,
		sparse: true,
	},
	wallets: {
		type: [String],
		default: [],
	},
	lastLoginAt: {
		type: Date,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
