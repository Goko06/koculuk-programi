import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Clock } from 'lucide-react';

export default async function CoachPage() {
  const supabase = await createClient();

  // 1. Oturum Kontrolü
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // 2. Rol Kontrolü (Veritabanındaki 'profiles' tablonuzdan)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Eğer kullanıcı koç değilse öğrenci sayfasına postala
  if (profile?.role !== 'coach') {
    redirect('/student');
  }

  // 3. Her şey tamamsa sayfayı render et
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Hoş Geldiniz, Koç!</h1>
        <p className="text-slate-600 mt-2">Öğrencilerinizin genel durumuna göz atın.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Öğrenci</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">14</div>
            <p className="text-xs text-emerald-600 mt-1">+2 bu ay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ortalama İlerleme</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">78%</div>
            <p className="text-xs text-slate-500 mt-1">Son 30 gün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktif Bu Hafta</CardTitle>
            <Clock className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">11</div>
            <p className="text-xs text-slate-500 mt-1">Öğrenci</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Öğrencilerim</h2>
        <p className="text-slate-500">Öğrenci listesi yakında burada görünecek...</p>
      </div>
    </div>
  );
}
