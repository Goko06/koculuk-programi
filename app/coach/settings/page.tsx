'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings, User, Lock, Bell, 
  Save, Loader2, LogOut, ShieldCheck, 
  Mail, Fingerprint 
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function CoachSettings() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          setProfileData({
            full_name: user.user_metadata?.full_name || '',
            email: user.email || '',
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getProfile();
  }, [supabase]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: profileData.full_name }
      });
      if (error) throw error;
      toast.success("Profil bilgileriniz güncellendi! ✨");
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("Şifreler eşleşmiyor!");
    }
    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      if (error) throw error;
      toast.success("Şifreniz başarıyla değiştirildi! 🔐");
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600 h-12 w-12" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-10 bg-slate-50 min-h-screen text-slate-900 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 rounded-[1.5rem] text-white shadow-xl">
            <Settings size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Ayarlar</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] italic">Hesap ve Uygulama Yönetimi</p>
          </div>
        </div>
        <Button 
          onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
          variant="outline" 
          className="rounded-2xl h-14 px-8 font-black text-xs uppercase tracking-widest border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
        >
          <LogOut size={18} className="mr-2" /> Güvenli Çıkış
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL: PROFİL AYARLARI */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[3rem] border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-10 pb-0">
               <CardTitle className="text-xl font-black flex items-center gap-3 italic">
                  <User className="text-blue-600" /> Profil Bilgileri
               </CardTitle>
            </CardHeader>
            <CardContent className="p-10">
               <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Tam Adınız</Label>
                       <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <Input 
                            value={profileData.full_name}
                            onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                            className="pl-12 h-14 rounded-2xl border-slate-100 font-bold bg-slate-50 focus:bg-white transition-all"
                          />
                       </div>
                    </div>
                    <div className="space-y-2 opacity-60">
                       <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">E-Posta (Değiştirilemez)</Label>
                       <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <Input disabled value={profileData.email} className="pl-12 h-14 rounded-2xl border-slate-100 font-bold bg-slate-100" />
                       </div>
                    </div>
                  </div>
                  <Button disabled={updating} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 h-14 font-black shadow-xl shadow-blue-100">
                    {updating ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Bilgileri Güncelle</>}
                  </Button>
               </form>
            </CardContent>
          </Card>

          {/* GÜVENLİK AYARLARI */}
          <Card className="rounded-[3rem] border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-10 pb-0">
               <CardTitle className="text-xl font-black flex items-center gap-3 italic">
                  <Lock className="text-orange-600" /> Şifre Değiştir
               </CardTitle>
            </CardHeader>
            <CardContent className="p-10">
               <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Yeni Şifre</Label>
                       <Input 
                        type="password"
                        placeholder="••••••••"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="h-14 rounded-2xl border-slate-100 font-bold bg-slate-50" 
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Şifre Tekrar</Label>
                       <Input 
                        type="password"
                        placeholder="••••••••"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="h-14 rounded-2xl border-slate-100 font-bold bg-slate-50" 
                       />
                    </div>
                  </div>
                  <Button disabled={updating} className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-8 h-14 font-black shadow-xl">
                    {updating ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={18} className="mr-2" /> Şifreyi Güncelle</>}
                  </Button>
               </form>
            </CardContent>
          </Card>
        </div>

        {/* SAĞ: DURUM VE BİLGİ */}
        <div className="space-y-8">
           <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 p-8 text-white relative overflow-hidden group">
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-white/10 rounded-2xl"><Fingerprint className="text-blue-400" size={24} /></div>
                    <h3 className="font-black text-lg">Hesap Durumu</h3>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                       <span className="text-xs font-bold text-slate-400">Yetki Seviyesi</span>
                       <span className="text-[10px] font-black bg-blue-600 px-3 py-1 rounded-lg uppercase">Eğitmen / Koç</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                       <span className="text-xs font-bold text-slate-400">Kayıt Tarihi</span>
                       <span className="text-xs font-black text-white">{new Date(user?.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                 </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/10 blur-[50px] rounded-full group-hover:bg-blue-600/20 transition-all duration-1000" />
           </Card>

           <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
              <h3 className="text-xl font-black flex items-center gap-3 italic mb-6">
                 <Bell className="text-blue-600" size={20} /> Bildirim Tercihleri
              </h3>
              <div className="space-y-4">
                 {[
                   { label: "Öğrenci ödevi bitirince", active: true },
                   { label: "Öğrenci deneme girince", active: true },
                   { label: "Günlük rapor gelince", active: true },
                 ].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                       <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{pref.label}</span>
                       <div className="w-10 h-6 bg-blue-600 rounded-full flex items-center px-1">
                          <div className="w-4 h-4 bg-white rounded-full translate-x-4 shadow-sm" />
                       </div>
                    </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
