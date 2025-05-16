// pages/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page when the Home page is accessed
    router.push('/login');
  }, [router]);

  return null; // Don't render anything since we're redirecting
}
