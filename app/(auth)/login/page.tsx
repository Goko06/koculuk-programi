"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client'; // client.ts yolun doğru olduğundan emin ol
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Supabase Auth ile Giriş
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        // 2. Profiles tablosundan Rolü çek
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profil çekme hatası:", profileError.message);
          // Profil bulunamazsa varsayılana at
          router.push('/dashboard');
          return;
        }

        // 3. Rol Kontrolü ve Yönlendirme
        const userRole = profile?.role?.toLowerCase();
        console.log("Giriş Başarılı. Rol:", userRole);

        if (userRole === 'coach') {
          router.push('/coach');
        } else if (userRole === 'student') {
          router.push('/student');
        } else {
          console.warn("Tanımsız rol, dashboard'a yönlendiriliyor.");
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-slate-900">
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Giriş Yap</CardTitle>
          <p className="text-sm text-slate-500 text-center">
            Hesabınıza erişmek için bilgilerinizi girin
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">E-posta</label>
              <input
                type="email"
                required
                className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                placeholder="ornek@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Şifre</label>
              <input
                type="password"
                required
                className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white p-2 rounded-md hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
