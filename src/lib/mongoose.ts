import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
	throw new Error('Please add your Mongo URI to .env.local');
}

const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

export async function dbConnect() {
	if (isConnected) {
		return;
	}

	try {
		await mongoose.connect(MONGODB_URI);
		isConnected = true;
		console.log('Connected to MongoDB');
	} catch (error) {
		console.error('Error connecting to MongoDB:', error);
		throw error;
	}
}
