'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      toast.success("Giriş başarılı! Hoş geldiniz.");
      
      // Başarılı giriş sonrası öğrenci paneline yönlendir
      router.push('/student');
      router.refresh();

    } catch (error: any) {
      toast.error(error.message === "Invalid login credentials" 
        ? "E-posta veya şifre hatalı." 
        : "Giriş başarısız oldu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-6">
            <Image 
              src="/logo.png" 
              alt="Göksel Atak Eğitim Kurumları" 
              width={260} 
              height={80}
              priority
              className="mx-auto"
            />
          </div>
          <CardTitle className="text-2xl text-slate-900">Öğrenci Girişi</CardTitle>
          <p className="text-slate-600 mt-2">Hoş geldiniz</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="email">E-posta Adresi</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@gokselatak.com"
                required
                className="h-12 mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifreniz"
                required
                className="h-12 mt-1.5"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-medium" 
              disabled={isLoading}
            >
              {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Hesabınız yok mu? <br />
            Koçunuzla iletişime geçerek kayıt olabilirsiniz.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}