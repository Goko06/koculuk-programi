'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button'; 
import { Card, CardContent, CardHeader } from '@/components/ui/card'; // Shadcn Card içindeki Button veya global Button
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, User, GraduationCap, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (selectedType: 'student' | 'coach') => {
    if (!email || !password) {
      return toast.error("Lütfen tüm alanları doldurun.");
    }

    setIsLoading(true);

    try {
      // 1. Giriş yap
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // "Email not confirmed" hatasını özel olarak yakala
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Giriş yapabilmeniz için e-posta onayı gerekmektedir. Lütfen koçunuzla iletişime geçin veya e-postanızı kontrol edin.");
        }
        throw error;
      }

      // 2. Kullanıcının rolünü profiles tablosundan al
      // Not: Eğer koç öğrenciyi eklerken profiles tablosuna kayıt atmıyorsa 
      // burayı 'students' tablosuna bakacak şekilde güncelleyebiliriz.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      // Eğer profile bulunamazsa varsayılan olarak 'student' kabul et (senin mantığın)
      const userRole = profile?.role || 'student';

      // 3. Rol Kontrolü
      if (selectedType === 'student' && userRole === 'coach') {
        toast.error("Bu hesap bir Koç hesabıdır. Lütfen 'Koç Girişi' butonunu kullanın.");
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      if (selectedType === 'coach' && userRole === 'student') {
        toast.error("Bu hesap bir Öğrenci hesabıdır. Lütfen 'Öğrenci Girişi' butonunu kullanın.");
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      toast.success(`Hoş geldiniz, ${selectedType === 'coach' ? 'Koç' : 'Öğrenci'} girişi başarılı.`);

      // 4. Yönlendirme (Next.js 13+ router.push bazen cache takılabilir, bu yüzden bazen window.location kullanılır ama push yeterli)
      if (userRole === 'coach') {
        router.push('/coach');
      } else {
        router.push('/student');
      }

    } catch (error: any) {
      toast.error(error.message || "Giriş yapılamadı.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Arka Plan Dekorasyonu - SaaS Hissiyatı */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] -z-10" />

      <Card className="w-full max-w-[450px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-none rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="text-center pt-12 pb-6 px-10">
          <div className="mb-8 flex justify-center">
            {/* Logo Yolu Seninkine Göre Ayarlı */}
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={220} 
              height={60}
              priority
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tekrar Hoş Geldin!</h1>
          <p className="text-slate-400 font-medium mt-2">Eğitim yolculuğuna devam etmek için giriş yap.</p>
        </CardHeader>

        <CardContent className="px-10 pb-12 space-y-6">
          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase tracking-widest text-slate-400 ml-1">E-posta Adresi</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@mail.com"
              className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase tracking-widest text-slate-400 ml-1">Şifre</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            />
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <Button 
              onClick={() => handleLogin('student')}
              disabled={isLoading}
              className="h-16 text-lg font-black bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <GraduationCap size={24} />}
              Öğrenci Girişi
            </Button>

            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-300 font-bold tracking-widest">VEYA</span></div>
            </div>

            <button 
              onClick={() => handleLogin('coach')}
              disabled={isLoading}
              className="h-16 text-lg font-black bg-white border-2 border-slate-100 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <ShieldCheck size={24} className="text-blue-500" />
              Koç Girişi
            </button>
          </div>
          
          <p className="text-center text-xs text-slate-400 font-medium">
            Şifrenizi mi unuttunuz? Lütfen eğitim koçunuzla görüşün.
          </p>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-slate-300 text-sm font-bold tracking-tight">
        © 2026 Göksel Atak Eğitim Kurumları
      </p>
    </div>
  );
}
