'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

  const handleLogin = async (selectedType: 'student' | 'coach') => {
    setIsLoading(true);

    try {
      // 1. Giriş yap
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // 2. Kullanıcının rolünü profiles tablosundan al
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      const userRole = profile?.role || 'student';

      // 3. Kontrol: Seçilen buton ile gerçek rol uyumlu mu?
      if (selectedType === 'student' && userRole === 'coach') {
        toast.error("Bu hesap bir koç hesabıdır. Lütfen 'Koç Girişi' butonunu kullanın.");
        await supabase.auth.signOut();
        return;
      }

      if (selectedType === 'coach' && userRole === 'student') {
        toast.error("Bu hesap bir öğrenci hesabıdır. Lütfen 'Öğrenci Girişi' butonunu kullanın.");
        await supabase.auth.signOut();
        return;
      }

      toast.success(`${selectedType === 'coach' ? 'Koç' : 'Öğrenci'} olarak giriş yapıldı.`);

      // 4. Yönlendirme
      if (userRole === 'coach') {
        router.push('/coach');
      } else {
        router.push('/student');
      }

    } catch (error: any) {
      toast.error("Giriş başarısız: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pt-10 pb-8">
          <Image 
            src="/logo.png" 
            alt="Göksel Atak Eğitim Kurumları" 
            width={270} 
            height={80}
            priority
            className="mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-slate-900">Giriş Yap</h1>
        </CardHeader>

        <CardContent className="px-8 pb-10 space-y-8">
          <div>
            <Label>E-posta</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@adresiniz.com"
              className="h-12 mt-2"
            />
          </div>

          <div>
            <Label>Şifre</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifreniz"
              className="h-12 mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6">
            <Button 
              onClick={() => handleLogin('student')}
              disabled={isLoading}
              className="h-14 text-lg bg-blue-600 hover:bg-blue-700"
            >
              Öğrenci Girişi
            </Button>

            <Button 
              onClick={() => handleLogin('coach')}
              disabled={isLoading}
              variant="outline"
              className="h-14 text-lg border-2"
            >
              Koç Girişi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}