'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Key, Save, ShieldCheck, Phone, UserCog, Loader2 } from 'lucide-react';

export default function StudentSettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const supabase = createClient();

  // Mevcut telefon numarasını yükle
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('students')
            .select('phone')
            .eq('id', user.id)
            .single();
          
          if (data?.phone) setPhone(data.phone);
        }
      } catch (error) {
        console.error("Profil yüklenemedi:", error);
      } finally {
        setInitialLoading(false);
      }
    }
    loadProfile();
  }, [supabase]);

  // Telefon Numarası Güncelleme
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('students')
        .update({ phone: phone })
        .eq('id', user?.id);

      if (error) throw error;
      toast.success("İletişim bilgileriniz güncellendi! ✅");
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Şifre Güncelleme
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Şifreler birbiriyle eşleşmiyor.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Şifreniz başarıyla güncellendi! 🔒");
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl px-4 font-sans">
      <div className="mb-10 flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
          <UserCog size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Profil Ayarları</h1>
          <p className="text-slate-500 font-medium">Hesap bilgilerinizi ve güvenliğinizi yönetin.</p>
        </div>
      </div>

      <div className="grid gap-8">
        
        {/* TELEFON NUMARASI AYARI */}
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Phone className="text-blue-600 h-5 w-5" />
              <CardTitle className="text-xl font-bold">İletişim Bilgileri</CardTitle>
            </div>
            <CardDescription className="font-medium">
              Koçunuzun size WhatsApp üzerinden ulaşabilmesi için numaranızı ekleyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Telefon Numarası</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">+90</span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="5xx xxx xx xx"
                    className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold text-lg"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl gap-2 font-black shadow-lg shadow-blue-100 transition-all active:scale-95" 
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Bilgileri Kaydet</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* GÜVENLİK / ŞİFRE AYARI */}
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-emerald-600 h-5 w-5" />
              <CardTitle className="text-xl font-bold">Güvenlik</CardTitle>
            </div>
            <CardDescription className="font-medium">
              Geçici şifrenizi güçlü ve hatırlayabileceğiniz bir şifreyle değiştirin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Yeni Şifre</Label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Yeni Şifre (Tekrar)</Label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                variant="outline"
                className="w-full h-14 rounded-2xl gap-2 font-black border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all active:scale-95" 
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : "Şifreyi Güncelle"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* UYARI BİLGİSİ */}
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 flex items-start gap-4">
          <ShieldCheck className="text-amber-600 mt-1" size={20} />
          <p className="text-sm text-amber-800 font-medium leading-relaxed">
            <span className="font-black">Önemli:</span> Şifre değişikliği sonrası tüm cihazlarda oturumunuz aktif kalabilir ancak tekrar giriş yapmanız gerektiğinde yeni şifrenizi kullanmalısınız. Numaranızın güncel olması, koçunuzun size acil durumlarda ulaşabilmesi için kritiktir.
          </p>
        </div>
      </div>
    </div>
  );
}
