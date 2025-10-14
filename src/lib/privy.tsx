'use client';

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

function PrivyAuthHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();

  useEffect(() => {
    if (ready && authenticated && window.location.pathname === '/login') {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  return <>{children}</>;
}

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <BasePrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#4F46E5', // Indigo-600
          logo: undefined,
        },
        loginMethods: ['email', 'wallet'],
        legal: {
          termsAndConditionsUrl: undefined,
          privacyPolicyUrl: undefined,
        },
      }}
    >
      <PrivyAuthHandler>{children}</PrivyAuthHandler>
    </BasePrivyProvider>
  );
}
