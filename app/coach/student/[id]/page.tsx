'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress"; 
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, CheckCircle2, Circle, Calendar, 
  Loader2, Clock, ChevronRight, LayoutGrid, 
  Sparkles, MessageSquare, Brain, 
  AlertTriangle, Info, TrendingUp, Activity, Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

// --- ÖĞRENCİ SAYFASIYLA BİREBİR AYNI LİSTE (ID'ler Çok Önemli) ---
const ALL_SUBJECTS_MASTER = [
  // LGS
  { id: 'mat-lgs', name: 'Matematik', icon: '📐', total: 12, level: 'LGS' },
  { id: 'fen-lgs', name: 'Fen Bilimleri', icon: '🧪', total: 7, level: 'LGS' },
  { id: 'tur-lgs', name: 'Türkçe', icon: '📝', total: 10, level: 'LGS' },
  { id: 'ing-lgs', name: 'İngilizce', icon: '🇬🇧', total: 10, level: 'LGS' },
  { id: 'ink-lgs', name: 'İnkılap', icon: '📜', total: 6, level: 'LGS' },
  { id: 'din-lgs', name: 'Din Kültürü', icon: '🌙', total: 5, level: 'LGS' },
  // YKS
  { id: 'mat-tyt', name: 'TYT Matematik', icon: '📐', total: 16, level: 'YKS' },
  { id: 'mat-ayt', name: 'AYT Matematik', icon: '📊', total: 8, level: 'YKS' },
  { id: 'tur-tyt', name: 'TYT Türkçe', icon: '📝', total: 12, level: 'YKS' },
  { id: 'fiz-tyt', name: 'TYT Fizik', icon: '⚛️', total: 10, level: 'YKS' },
  { id: 'edebiyat', name: 'AYT Edebiyat', icon: '📚', total: 11, level: 'YKS' }
];

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export default function CoachStudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'program' | 'curriculum'>('overview'); 
  const [student, setStudent] = useState<any>(null);
  const [completedTopics, setCompletedTopics] = useState<any[]>([]);
  const [weeklyProgram, setWeeklyProgram] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [activeDay, setActiveDay] = useState('Pazartesi');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Öğrenci Bilgisi
      const { data: sData } = await supabase.from('students').select('*').eq('id', id).single();
      setStudent(sData);

      // 2. Müfredat Bilgisi (Öğrencinin bitirdiği tüm kayıtlar)
      const { data: cData, error: cError } = await supabase
        .from('student_curriculum') 
        .select('*')
        .eq('student_id', id); // is_completed filtresini kod içinde yapacağız

      if (cError) throw cError;
      setCompletedTopics(cData || []);

      // 3. Program ve İstatistikler
      const { data: pData } = await supabase.from('weekly_programs').select('*').eq('student_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      setWeeklyProgram(pData);

      const { data: dData } = await supabase.from('daily_reports').select('*').eq('student_id', id).order('date', { ascending: false }).limit(7);
      setDailyStats(dData || []);

      const today = format(new Date(), 'EEEE', { locale: tr });
      const matchedDay = DAYS.find(d => d.toLowerCase() === today.toLowerCase());
      if (matchedDay) setActiveDay(matchedDay);

    } catch (error) {
      console.error("Veri çekme hatası:", error);
      toast.error("Veriler senkronize edilemedi.");
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Seviyeye Göre Ders Filtreleme
  const isLGS = ["5", "6", "7", "8"].includes(student?.grade_level);
  const filteredSubjects = ALL_SUBJECTS_MASTER.filter(s => isLGS ? s.level === 'LGS' : s.level === 'YKS');

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 font-black text-blue-600 animate-pulse text-xs tracking-widest uppercase">Veriler Eşitleniyor...</div>;

  const currentDayTasks = weeklyProgram?.program_data?.[activeDay] || [];
  const totalQuestions = dailyStats.reduce((acc, curr) => acc + (curr.questionCount || 0), 0);
  const totalPomo = dailyStats.reduce((acc, curr) => acc + (curr.pomodoroMinutes || 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 pb-32">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-6">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full w-14 h-14 p-0 bg-slate-50 hover:bg-slate-900 hover:text-white transition-all"><ArrowLeft size={28} /></Button>
          <div className="text-left">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-2"><Sparkles className="text-blue-600" size={24} /> {student?.full_name}</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-none mt-1">{student?.grade_level}. Sınıf • {student?.major || 'Genel'}</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-2 rounded-[2rem] w-full md:w-auto shadow-inner">
          {['overview', 'program', 'curriculum'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 md:px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow-lg text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab === 'overview' ? 'Özet' : tab === 'program' ? 'Görevler' : 'Müfredat'}
            </button>
          ))}
        </div>
      </div>

      {/* ÖZET SEKME */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-700 text-left">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-8 rounded-[2.5rem] border-none bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                 <Zap className="absolute -right-4 -top-4 text-white/5" size={140} />
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Haftalık Soru</p>
                 <h3 className="text-5xl font-black italic mt-2">{totalQuestions}</h3>
              </Card>
              <Card className="p-8 rounded-[2.5rem] border-none bg-white shadow-sm flex flex-col justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Haftalık Odaklanma</p>
                    <h3 className="text-4xl font-black text-slate-900 mt-2">{totalPomo} <span className="text-sm opacity-30 italic font-bold">dk</span></h3>
                 </div>
              </Card>
              <Card className="p-8 rounded-[2.5rem] border-none bg-white shadow-sm flex flex-col justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Müfredat İlerlemesi</p>
                    <h3 className="text-4xl font-black text-slate-900 mt-2">%{Math.round((completedTopics.length / 200) * 100)}</h3>
                 </div>
              </Card>
           </div>
        </div>
      )}

      {/* GÖREVLER SEKME */}
      {activeTab === 'program' && (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 text-left">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {DAYS.map((day) => (
                  <button key={day} onClick={() => setActiveDay(day)} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${activeDay === day ? "bg-slate-900 text-white border-slate-900 shadow-xl" : "bg-white text-slate-400 border-slate-100"}`}>{day}</button>
                ))}
              </div>
              <Button onClick={() => router.push(`/coach/assign-program/${id}`)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase h-12 px-8 shadow-xl shadow-blue-100">Programı Düzenle</Button>
           </div>
           
           <div className="grid gap-4">
              {currentDayTasks.length === 0 ? (
                <div className="p-24 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
                   <LayoutGrid size={48} className="text-slate-100 mb-4" />
                   <p className="text-slate-400 font-black italic uppercase text-xs">Bu gün için görev atanmamış</p>
                </div>
              ) : (
                currentDayTasks.map((task: any, idx: number) => (
                  <Card key={idx} className={`p-8 rounded-[2.5rem] border-none shadow-sm flex items-center justify-between transition-all ${task.completed ? "bg-emerald-50/50" : "bg-white"}`}>
                    <div className="flex items-center gap-6">
                       {task.completed ? <CheckCircle2 size={32} className="text-emerald-500" /> : <Circle size={32} className="text-slate-100" />}
                       <div className="text-left">
                          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest px-2 py-1 bg-blue-50 rounded-lg">{task.subject}</span>
                          <h3 className={`text-xl font-black mt-1 ${task.completed ? "text-slate-300 line-through italic" : "text-slate-900"}`}>{task.title}</h3>
                       </div>
                    </div>
                  </Card>
                ))
              )}
           </div>
        </div>
      )}

      {/* MÜFREDAT SEKME (DÜZELTİLEN KISIM) */}
      {activeTab === 'curriculum' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-6 duration-700 text-left">
          {filteredSubjects.map((subject) => {
            // FİLTRELEME MANTIĞI GÜNCELLENDİ: subject_id üzerinden eşleştirme yapar
            const subCompleted = completedTopics.filter((t: any) => t.subject_id === subject.id).length;
            const progress = Math.round((subCompleted / subject.total) * 100);

            return (
              <Card key={subject.id} className="p-8 rounded-[3rem] border-none shadow-sm bg-white hover:shadow-xl transition-all relative overflow-hidden">
                <div className="flex items-center gap-5 mb-8">
                  <div className="text-3xl bg-slate-50 w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner">{subject.icon}</div>
                  <div>
                    <h3 className="font-black text-xl text-slate-900 tracking-tighter leading-tight">{subject.name}</h3>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{subject.total} Toplam Ünite</p>
                  </div>
                </div>
                <div className="space-y-6">
                   <div className="flex justify-between items-end"><span className="text-4xl font-black text-slate-900 tracking-tighter">%{progress}</span></div>
                   <Progress value={progress} className="h-4 rounded-full bg-slate-50" />
                   <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 px-1">
                      <span>Bitirilen: {subCompleted}</span>
                      <span>Kalan: {subject.total - subCompleted}</span>
                   </div>
                   <Button variant="ghost" onClick={() => router.push(`/coach/student/${id}/curriculum/${subject.id}`)} className="w-full rounded-2xl bg-slate-900 text-white hover:bg-blue-600 font-black text-[10px] uppercase py-7">Konu Detaylarını Gör</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
