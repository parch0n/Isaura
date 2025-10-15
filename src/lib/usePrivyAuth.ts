'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState, useCallback, useRef } from 'react';

export function usePrivyAuth() {
	const { ready, authenticated, user, logout: privyLogout, getAccessToken } = usePrivy();
	const [synced, setSynced] = useState(false);
	const [jwtToken, setJwtToken] = useState<string | null>(null);
	const isSyncing = useRef(false);

	// Load JWT token from localStorage on mount
	useEffect(() => {
		const storedToken = localStorage.getItem('jwtToken');
		if (storedToken) {
			setJwtToken(storedToken);
		}
	}, []);

	// Exchange Privy token for JWT token on login
	useEffect(() => {
		const exchangeToken = async () => {
			if (!authenticated || !user || synced || isSyncing.current) return;

			isSyncing.current = true;

			try {
				// Get Privy access token
				const privyToken = await getAccessToken();

				// Exchange Privy token for JWT
				const response = await fetch('/api/auth/login', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${privyToken}`,
					},
				});

				if (!response.ok) {
					throw new Error('Failed to exchange token');
				}

				const data = await response.json();

				// Store JWT token
				const jwt = data.token;
				setJwtToken(jwt);
				localStorage.setItem('jwtToken', jwt);

				setSynced(true);
			} catch (error) {
				console.error('Error exchanging token:', error);
				isSyncing.current = false;
			}
		};

		exchangeToken();
	}, [authenticated, user, synced, getAccessToken]);

	const logout = useCallback(async () => {
		await privyLogout();
		setSynced(false);
		isSyncing.current = false;
		setJwtToken(null);
		localStorage.removeItem('jwtToken');
	}, [privyLogout]);

	const getAuthHeaders = useCallback(() => {
		if (!jwtToken) {
			throw new Error('No JWT token available');
		}
		return {
			Authorization: `Bearer ${jwtToken}`,
			'Content-Type': 'application/json',
		};
	}, [jwtToken]);

	return {
		ready,
		authenticated,
		user,
		logout,
		synced,
		getAuthHeaders,
		jwtToken,
	};
}
