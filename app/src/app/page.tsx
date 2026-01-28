'use client';

import { LandingPage } from '@/components/Landing/LandingPage';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export default function Home() {
  const router = useRouter();

  const handleGetStarted = useCallback(() => {
    router.push('/app');
  }, [router]);

  return <LandingPage onGetStarted={handleGetStarted} />;
}
