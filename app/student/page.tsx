'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { 
  BookOpen, 
  Trophy, 
  Activity, 
  MessageSquare, 
  Calendar, 
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  LayoutDashboard,
  Loader2,
  Smile // Eksik olan bu satırı ekledik
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function StudentDashboard() {
  const [student, setStudent] = useState<any>(null);
  const [latestProgram, setLatestProgram] = useState<any>(null);
  const [stats, setStats] = useState({ totalQuestions: 0, avgMood: '😊', weeklyDuration: 0 });
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const supabase = createClient();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Giriş yapan kullanıcının ID'sini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // 2. Öğrencinin GERÇEK ismini ve bilgilerini çek
      const { data: sData, error: sError } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (sError) {
        console.error("Öğrenci verisi bulunamadı:", sError);
      } else {
        setStudent(sData);
      }

      // 3. Haftalık Program Bilgisi
      const { data: pData } = await supabase
        .from('weekly_programs')
        .select('*')
        .eq('student_id', user.id)
        .order('week_start_date', { ascending: false })
        .limit(1)
        .single();
      setLatestProgram(pData || null);

      // 4. Haftalık İstatistik Özeti
      const { data: dData } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('student_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(7);

      if (dData && dData.length > 0) {
        let totalQ = 0;
        let totalD = 0;
        
        dData.forEach(entry => {
          totalD += (entry.total_duration_minutes || 0);
          if (entry.subjects_data) {
            entry.subjects_data.forEach((s: any) => {
              totalQ += (Number(s.questions) || 0);
            });
          }
        });

        setStats({ 
          totalQuestions: totalQ, 
          avgMood: dData[0]?.mood || '😊', 
          weeklyDuration: totalD 
        });
      }

    } catch (error) {
      console.error("Panel yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <Loader2 className="animate-spin text-blue-600 h-12 w-12 mb-4" />
      <p className="text-slate-500 font-bold tracking-widest animate-pulse uppercase text-xs">Öğrenci Paneli Hazırlanıyor...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      
      {/* ÜST PANEL - KARŞILAMA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-blue-600 rounded-[1.5rem] text-white shadow-xl shadow-blue-100">
              <LayoutDashboard size={32} />
           </div>
           <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                Öğrenci Paneli
              </h1>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 italic">
                 Hoş geldin, <span className="text-blue-600">{student?.full_name || "Öğrenci"}</span> 👋
              </p>
           </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <Button 
            onClick={() => router.push('/student/daily')} 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 px-8 font-black shadow-xl shadow-blue-100 gap-3 transition-all active:scale-95"
          >
            <BookOpen size={20} /> Çalışma Kaydet
          </Button>
          <Button 
            onClick={() => router.push('/student/exam')} 
            className="flex-1 bg-slate-900 hover:bg-black text-white rounded-2xl h-14 px-8 font-black shadow-xl shadow-slate-100 gap-3 transition-all active:scale-95"
          >
            <Trophy size={20} className="text-amber-400" /> Deneme Ekle
          </Button>
        </div>
      </div>

      {/* HAFTALIK ÖZET KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-none shadow-sm rounded-[2rem] p-8 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Haftalık Toplam Soru</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-slate-900">{stats.totalQuestions}</span>
              <span className="text-blue-600 font-bold text-xs mb-1">Soru</span>
            </div>
          </div>
          <TrendingUp className="absolute -bottom-4 -right-4 w-24 h-24 text-blue-50 opacity-50 group-hover:scale-110 transition-transform" />
        </Card>

        <Card className="bg-white border-none shadow-sm rounded-[2rem] p-8 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Haftalık Çalışma</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-slate-900">{Math.round(stats.weeklyDuration / 60)}</span>
              <span className="text-emerald-600 font-bold text-xs mb-1">Saat</span>
            </div>
          </div>
          <Clock className="absolute -bottom-4 -right-4 w-24 h-24 text-emerald-50 opacity-50 group-hover:scale-110 transition-transform" />
        </Card>

        <Card className="bg-white border-none shadow-sm rounded-[2rem] p-8 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Genel Duygu Durumu</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl">{stats.avgMood}</span>
              <span className="text-amber-600 font-bold text-xs mb-1 italic">Pozitif</span>
            </div>
          </div>
          <Smile className="absolute -bottom-4 -right-4 w-24 h-24 text-amber-50 opacity-50 group-hover:scale-110 transition-transform" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SOL: GÜNLÜK PROGRAMIN */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black flex items-center gap-3 px-2 uppercase tracking-tighter">
              <Calendar className="text-blue-600" /> Bugün Ne Çalışmalıyım?
          </h2>

          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white min-h-[300px]">
            <CardContent className="p-0">
              {latestProgram ? (
                <div className="divide-y divide-slate-50">
                  {/* Sadece bugünü daha belirgin gösteriyoruz */}
                  <div className="p-8 bg-blue-50/30 flex items-center justify-between">
                     <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-100">
                           {format(new Date(), 'dd', { locale: tr })}
                        </div>
                        <div>
                           <h4 className="font-black text-slate-900 uppercase text-sm tracking-widest italic">Bugünkü Hedeflerin</h4>
                           <p className="text-sm text-slate-500 font-medium mt-1">
                              Koçun bugün için {latestProgram.program_data[format(new Date(), 'eeee').toLowerCase()]?.length || 0} görev planladı.
                           </p>
                        </div>
                     </div>
                     <Button variant="outline" className="rounded-2xl h-12 border-blue-200 text-blue-600 font-black text-xs hover:bg-blue-600 hover:text-white transition-all">PROGRAMI İNCELE</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-4">
                    <Calendar size={32} className="text-slate-300" />
                  </div>
                  <h4 className="text-slate-400 font-black italic">Henüz haftalık programın atanmamış.</h4>
                  <p className="text-slate-300 text-sm mt-1 uppercase tracking-widest font-bold">Lütfen koçunla iletişime geç!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SAĞ: KOÇ NOTU VE MOTİVASYON */}
        <div className="space-y-6">
          <h2 className="text-xl font-black flex items-center gap-3 px-2 uppercase tracking-tighter">
            <MessageSquare className="text-blue-600" /> Koçumun Notu
          </h2>
          
          <Card className="bg-slate-900 rounded-[2.5rem] border-none shadow-2xl p-8 text-white relative overflow-hidden group">
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-900/50">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="font-black text-xl tracking-tight">Motivasyon Mesajı</h3>
               </div>
               
               <p className="text-slate-300 text-sm font-medium italic leading-relaxed mb-8">
                 "Başarı, her gün tekrarlanan küçük disiplinlerin toplamıdır. Bugün attığın her soru, hayallerine giden bir basamaktır. Harika iş çıkarıyorsun!"
               </p>
               
               <div className="pt-6 border-t border-white/10 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-[1rem] flex items-center justify-center font-black text-blue-400">GA</div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-white">Eğitim Koçun</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Süreç Takipte</p>
                  </div>
               </div>
            </div>
            {/* Dekoratif efekt */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full" />
          </Card>

          {/* DENEME SINAVI ANALİZ KISAYOLU */}
          <Card 
            onClick={() => router.push('/student/exam')}
            className="bg-white rounded-[2.5rem] border-none shadow-sm p-8 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all group border border-slate-50"
          >
             <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-amber-50 text-amber-500 rounded-3xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-500">
                    <Trophy size={28} />
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-slate-900 transition-colors" />
             </div>
             <h3 className="font-black text-xl text-slate-900 tracking-tight">Deneme Analizleri</h3>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.15em] mt-1 leading-relaxed">Sınav sonuçlarını gör ve gelişimini takip et.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
