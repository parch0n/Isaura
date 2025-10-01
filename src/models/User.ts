import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true,
	},
	emailVerified: {
		type: Boolean,
		default: false,
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
