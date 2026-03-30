'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    // Geçici olarak öğrenci paneline yönlendiriyoruz
    redirect('/student');
  }, []);

  // Bu kısım hiç görünmeyecek ama Next.js için gereklidir
  return <div className="flex items-center justify-center min-h-screen">
    Yönlendiriliyor...
  </div>;
}