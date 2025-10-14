'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState, useCallback, useRef } from 'react';

export function usePrivyAuth() {
	const { ready, authenticated, user, logout: privyLogout, getAccessToken } = usePrivy();
	const [synced, setSynced] = useState(false);
	const isSyncing = useRef(false);

	useEffect(() => {
		const syncUser = async () => {
			if (!authenticated || !user || synced || isSyncing.current) return;

			isSyncing.current = true;

			try {
				const email = user.email?.address;
				const walletAddresses = user.wallet?.address
					? [user.wallet.address]
					: user.linkedAccounts
							?.filter((account) => account.type === 'wallet')
							.map((account) => account.address) || [];

				let loginMethod = 'email';
				if (walletAddresses.length > 0 && !email) {
					loginMethod = 'wallet';
				} else if (walletAddresses.length > 0 && email) {
					loginMethod = 'email';
				}

				const response = await fetch('/api/auth/privy', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						privyUserId: user.id,
						email,
						walletAddresses,
						loginMethod,
					}),
				});

				if (!response.ok) {
					throw new Error('Failed to sync user');
				}

				setSynced(true);
			} catch (error) {
				console.error('Error syncing user:', error);
				isSyncing.current = false;
			}
		};

		syncUser();
	}, [authenticated, user, synced]);

	const logout = useCallback(async () => {
		await privyLogout();
		setSynced(false);
		isSyncing.current = false;
	}, [privyLogout]);

	const getAuthHeaders = useCallback(async () => {
		const token = await getAccessToken();
		return {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		};
	}, [getAccessToken]);

	return {
		ready,
		authenticated,
		user,
		logout,
		synced,
		getAuthHeaders,
	};
}
