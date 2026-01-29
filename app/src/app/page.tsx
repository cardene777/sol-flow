'use client';

import { LandingPage } from '@/components/Landing/LandingPage';
import { useLanguage } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export default function Home() {
  const router = useRouter();
  const { language } = useLanguage();

  const handleGetStarted = useCallback(() => {
    router.push('/app');
  }, [router]);

  return <LandingPage key={language} onGetStarted={handleGetStarted} />;
}
