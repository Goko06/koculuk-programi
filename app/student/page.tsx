'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, Calendar, TrendingUp, 
  ChevronRight, GraduationCap,
  Rocket, School, Timer, FileText, 
  LogOut, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';

export default function StudentDashboard() {
  const [student, setStudent] = useState<any>(null);
  const [target, setTarget] = useState<any>(null);
  const [avgs, setAvgs] = useState({ tyt: 0, ayt: 0 });
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Profil Bilgisi
        const { data: sData } = await supabase.from('students').select('*').eq('id', user.id).single();
        setStudent(sData);

        // 2. Üniversite Hedefi
        const { data: tData } = await supabase.from('student_targets').select('*').eq('student_id', user.id).maybeSingle();
        setTarget(tData);

        // 3. Deneme Ortalamalarını Hesapla (Banner Analizi İçin)
        const { data: eData } = await supabase.from('exams').select('total_net, exam_type').eq('student_id', user.id);
        if (eData) {
          const tytExams = eData.filter(e => e.exam_type === 'TYT');
          const aytExams = eData.filter(e => e.exam_type === 'AYT');
          setAvgs({
            tyt: tytExams.length > 0 ? Number((tytExams.reduce((acc, curr) => acc + curr.total_net, 0) / tytExams.length).toFixed(1)) : 0,
            ayt: aytExams.length > 0 ? Number((aytExams.reduce((acc, curr) => acc + curr.total_net, 0) / aytExams.length).toFixed(1)) : 0
          });
        }

      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [supabase]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50 font-black text-blue-600 animate-pulse uppercase tracking-[0.3em]">
      YÜKLENİYOR...
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-600 rounded-[1.8rem] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-100 uppercase">
            {student?.full_name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 italic">
              Selam, {student?.full_name?.split(' ')[0]}!
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] italic flex items-center gap-2">
               <GraduationCap size={14} className="text-blue-600" /> {student?.grade_level} Gelişim Paneli
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <NotificationBell />
           <Button 
            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} 
            variant="outline" 
            className="rounded-2xl h-14 px-6 font-black text-[10px] uppercase tracking-widest border-slate-200 hover:bg-red-50 hover:text-red-600 transition-all"
           >
              <LogOut size={18} className="mr-2" /> Çıkış
           </Button>
        </div>
      </div>

      {/* ÜNİVERSİTE HEDEFİ BANNER */}
      <Card 
        onClick={() => router.push('/student/target')}
        className="rounded-[3rem] border-none bg-slate-900 p-8 text-white relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-500"
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-6">
              <div className={`p-5 rounded-3xl shadow-lg transition-transform group-hover:scale-110 ${target?.program_type === '4-yillik' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                <School size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1 italic">HEDEFLEDİĞİN HAYAT</p>
                <h2 className="text-2xl font-black tracking-tight uppercase">
                  {target ? target.university_name : "Üniversite Hedefi Belirle"}
                </h2>
                <p className="text-sm font-bold text-slate-400 italic">
                  {target ? target.department_name : "Hayallerine bir adım atmak için tıkla."}
                </p>
              </div>
           </div>

           {target && (
             <div className="flex gap-10">
                <div className="text-center">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">TYT BAŞARI</p>
                   <p className="text-3xl font-black text-blue-400">%{Math.min(Math.round((avgs.tyt / target.target_net_tyt) * 100), 100) || 0}</p>
                </div>
                {target.program_type === '4-yillik' && (
                  <div className="text-center border-l border-white/10 pl-10">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">AYT BAŞARI</p>
                     <p className="text-3xl font-black text-orange-400">%{Math.min(Math.round((avgs.ayt / target.target_net_ayt) * 100), 100) || 0}</p>
                  </div>
                )}
             </div>
           )}

           {!target && <Rocket size={40} className="text-white/10 group-hover:text-blue-500 transition-colors" />}
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full" />
      </Card>

      {/* ANA KISAYOLLAR GRİD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* 1. DERS PROGRAMIM */}
        <Card onClick={() => router.push('/student/program')} className="rounded-[3rem] border-none shadow-sm bg-white p-10 cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden">
           <div className="relative z-10">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                 <Calendar size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 italic tracking-tight uppercase">Ders Programım</h3>
              <p className="text-slate-400 font-bold text-sm leading-relaxed">Haftalık görevlerini takip et ve bitir.</p>
           </div>
           <ChevronRight className="absolute bottom-10 right-10 text-slate-100 group-hover:text-blue-600 transition-all" size={32} />
        </Card>
        {/* 7. Konu Takibim */}
<Card onClick={() => router.push('/student/curriculum')} className="rounded-[3rem] border-none shadow-sm bg-white p-10 cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden border border-slate-100">
   <div className="relative z-10">
      <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl w-fit mb-6 group-hover:bg-orange-600 group-hover:text-white transition-all">
         <GraduationCap size={32} />
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-2 italic tracking-tight uppercase">Konu Takibi</h3>
      <p className="text-slate-400 font-bold text-sm leading-relaxed">Müfredatta hangi konuları bitirdin? Kontrol et.</p>
   </div>
   <ChevronRight className="absolute bottom-10 right-10 text-slate-100 group-hover:text-orange-600 transition-all" size={32} />
</Card>


        {/* 2. SINAV ANALİZİ */}
        <Card onClick={() => router.push('/student/exam')} className="rounded-[3rem] border-none shadow-sm bg-white p-10 cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden">
           <div className="relative z-10">
              <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl w-fit mb-6 group-hover:bg-orange-600 group-hover:text-white transition-all">
                 <TrendingUp size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 italic tracking-tight uppercase">Sınav Analizleri</h3>
              <p className="text-slate-400 font-bold text-sm leading-relaxed">Net artış grafiklerini ve sonuçları gör.</p>
           </div>
           <ChevronRight className="absolute bottom-10 right-10 text-slate-100 group-hover:text-orange-600 transition-all" size={32} />
        </Card>

        {/* 3. GÜNLÜK RAPOR */}
        <Card onClick={() => router.push('/student/daily')} className="rounded-[3rem] border-none shadow-sm bg-white p-10 cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden">
           <div className="relative z-10">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                 <BookOpen size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 italic tracking-tight uppercase">Günlük Rapor</h3>
              <p className="text-slate-400 font-bold text-sm leading-relaxed">Bugünkü soru ve sürelerini hemen gir.</p>
           </div>
           <ChevronRight className="absolute bottom-10 right-10 text-slate-100 group-hover:text-emerald-600 transition-all" size={32} />
        </Card>

        {/* 4. POMODORO SAYACI (YENİ) */}
        <Card onClick={() => router.push('/student/pomodoro')} className="rounded-[3rem] border-none shadow-sm bg-slate-900 p-10 cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden">
           <div className="relative z-10">
              <div className="p-4 bg-white/10 text-blue-400 rounded-2xl w-fit mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all backdrop-blur-md">
                 <Timer size={32} />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 italic tracking-tight uppercase">Pomodoro Sayacı</h3>
              <p className="text-slate-500 font-bold text-sm leading-relaxed">Derin odaklanma ile verimini artır.</p>
           </div>
           <ChevronRight className="absolute bottom-10 right-10 text-white/10 group-hover:text-blue-500 transition-all" size={32} />
        </Card>

        {/* 5. KOÇUMDAN GELENLER (YENİ) */}
        <Card onClick={() => router.push('/student/resources')} className="rounded-[3rem] border-none shadow-sm bg-white p-10 cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden border border-slate-100">
           <div className="relative z-10">
              <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl w-fit mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all">
                 <FileText size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 italic tracking-tight uppercase">Kaynak Kütüphanesi</h3>
              <p className="text-slate-400 font-bold text-sm leading-relaxed">Koçunun paylaştığı PDF ve dökümanlar.</p>
           </div>
           <ChevronRight className="absolute bottom-10 right-10 text-slate-100 group-hover:text-purple-600 transition-all" size={32} />
        </Card>

        {/* 6. MOTİVASYON KARTI */}
        <div className="rounded-[3rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-white flex flex-col justify-center relative overflow-hidden shadow-2xl shadow-blue-200">
           <Sparkles className="text-white/20 mb-4" size={40} />
           <p className="text-xl font-black italic leading-tight">"Zorluklar, başarıyı değerli kılan basamaklardır."</p>
           <p className="text-[10px] font-bold uppercase tracking-[0.3em] mt-4 text-blue-200">Günlük Motivasyon</p>
           <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>

      </div>
    </div>
  );
}
