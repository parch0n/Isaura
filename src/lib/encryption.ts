import CryptoJS from 'crypto-js';

export function encryptWallet(wallet: string, key: string): string {
	return CryptoJS.AES.encrypt(wallet, key).toString();
}

export function decryptWallet(encryptedWallet: string, key: string): string {
	const bytes = CryptoJS.AES.decrypt(encryptedWallet, key);
	return bytes.toString(CryptoJS.enc.Utf8);
}

export function decryptWallets(encryptedWallets: string[], key: string): string[] {
	return encryptedWallets.map((encrypted) => decryptWallet(encrypted, key));
}
