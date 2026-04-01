'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, CheckCircle2, Clock, BarChart3, Loader2, 
  BookOpen, MessageSquare, Target, Activity, Send, TrendingUp, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function CoachStudentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [latestProgram, setLatestProgram] = useState<any>(null);
  const [dailyEntries, setDailyEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      // 1. Öğrenci Bilgisi
      const { data: sData } = await supabase.from('students').select('*').eq('id', id).single();
      setStudent(sData);

      // 2. En Güncel Haftalık Program
      const { data: pData } = await supabase
        .from('weekly_programs')
        .select('*')
        .eq('student_id', id)
        .order('week_start_date', { ascending: false })
        .limit(1)
        .single();
      setLatestProgram(pData || null);

      // 3. Günlük Çalışma Raporları
      const { data: dData } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('student_id', id)
        .order('entry_date', { ascending: false })
        .limit(10);
      setDailyEntries(dData || []);
    } catch (error) { 
      console.error("Veri çekme hatası:", error); 
    } finally { 
      setLoading(false); 
    }
  }, [id, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveFeedback = async (entryId: string) => {
    if (!feedback[entryId]) return;
    setSubmitting(entryId);
    const { error } = await supabase
      .from('daily_entries')
      .update({ coach_note: feedback[entryId] })
      .eq('id', entryId);

    if (!error) {
        // State'i temizle ve veriyi yenile
        const newFeedback = { ...feedback };
        delete newFeedback[entryId];
        setFeedback(newFeedback);
        fetchData();
    }
    setSubmitting(null);
  };

  const odevStats = (() => {
    if (!latestProgram?.program_data) return { total: 0, done: 0, questions: 0, percent: 0 };
    let t = 0, d = 0, q = 0;
    Object.keys(latestProgram.program_data).forEach(day => {
      (latestProgram.program_data[day] || []).forEach((task: any) => {
        t++; 
        if (task.completed) { 
          d++; 
          q += (Number(task.solved_questions) || 0); 
        }
      });
    });
    return { total: t, done: d, questions: q, percent: t > 0 ? Math.round((d / t) * 100) : 0 };
  })();

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <Loader2 className="animate-spin text-blue-600 h-12 w-12 mb-4" />
      <p className="text-slate-500 font-black italic">Veriler Analiz Ediliyor...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      
      {/* ÜST NAVİGASYON */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="outline" onClick={() => router.back()} className="gap-2 bg-white border-slate-200 shadow-sm rounded-2xl px-6 h-12 font-bold hover:bg-slate-50 transition-all">
          <ArrowLeft size={18} /> Geri Dön
        </Button>
        
        <Button 
          onClick={() => router.push(`/coach/assign-program/${id}`)} 
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-100 font-black px-8 h-14 gap-2 transition-transform active:scale-95"
        >
          <Calendar size={20} /> Yeni Program Atama
        </Button>
      </div>

      {/* ÖĞRENCİ PROFİL KARTI */}
      <Card className="bg-white border-none shadow-sm rounded-[2.5rem] p-8 overflow-hidden relative">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl uppercase tracking-tighter">
              {student?.full_name?.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">{student?.full_name}</h1>
              <div className="flex items-center gap-2">
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 italic">
                    {student?.grade_level}
                </span>
                <p className="text-slate-400 font-bold text-sm">{student?.email}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center min-w-[150px]">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Haftalık Soru</p>
              <p className="text-4xl font-black text-slate-900 leading-none">{odevStats.questions}</p>
            </div>
            <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 text-center min-w-[150px]">
              <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-widest italic">Başarı Oranı</p>
              <p className="text-4xl font-black text-emerald-600 leading-none">%{odevStats.percent}</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL KOLON: GÜNLÜK RAPORLAR */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black flex items-center gap-2 px-2 tracking-tight"><Activity className="text-blue-600" /> Detaylı Günlük Raporlar</h2>
          
          {dailyEntries.map((entry) => (
            <Card key={entry.id} className="bg-white rounded-[2.5rem] border-none shadow-sm overflow-hidden group transition-all hover:shadow-md">
              <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="text-3xl drop-shadow-sm">{entry.mood || '😐'}</span>
                  <div>
                    <span className="font-black text-slate-800 text-lg leading-tight block">
                        {format(new Date(entry.entry_date), 'dd MMMM EEEE', { locale: tr })}
                    </span>
                    <span className="text-xs font-black text-blue-600 uppercase tracking-tighter flex items-center gap-1 mt-0.5">
                        <Clock size={12} /> {entry.total_duration_minutes} Dakika Çalışma
                    </span>
                  </div>
                </div>
              </div>

              <CardContent className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(entry.subjects_data || []).map((sub: any, idx: number) => (
                    <div key={idx} className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 group-hover:border-blue-200 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-black text-slate-800 tracking-tight leading-none">{sub.subject}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sub.duration} dk</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black italic">D: {sub.correct}</span>
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-[10px] font-black italic">Y: {sub.wrong}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1.5 opacity-70 italic font-bold tracking-tight">
                        <BookOpen size={10} className="text-blue-500" /> {sub.source}
                      </p>
                    </div>
                  ))}
                </div>

                {entry.general_note && (
                  <div className="mt-6 p-5 bg-amber-50/50 rounded-[1.5rem] border border-amber-100 flex gap-4 shadow-sm shadow-amber-50">
                    <MessageSquare size={20} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-900 italic font-bold leading-relaxed">"{entry.general_note}"</p>
                  </div>
                )}

                {/* KOÇ GERİ BİLDİRİMİ */}
                <div className="mt-8 pt-8 border-t border-slate-50">
                   {entry.coach_note && !feedback[entry.id] ? (
                     <div className="bg-blue-600 text-white p-6 rounded-[2rem] shadow-xl shadow-blue-100 flex justify-between items-center transition-all hover:scale-[1.01]">
                        <div className="flex gap-4 items-start">
                           <Send size={18} className="text-blue-200 mt-1" />
                           <p className="text-sm font-bold italic tracking-tight leading-relaxed">"{entry.coach_note}"</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          className="text-white/60 hover:text-white font-black text-[10px] uppercase tracking-widest" 
                          onClick={() => setFeedback({ ...feedback, [entry.id]: entry.coach_note })}
                        >Düzenle</Button>
                     </div>
                   ) : (
                     <div className="relative">
                        <textarea 
                          className="w-full min-h-[120px] p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all pr-20 placeholder:text-slate-300 italic"
                          placeholder="Öğrenciye bir not bırak..."
                          value={feedback[entry.id] || ""}
                          onChange={(e) => setFeedback({ ...feedback, [entry.id]: e.target.value })}
                        />
                        <Button 
                          disabled={submitting === entry.id || !feedback[entry.id]}
                          onClick={() => handleSaveFeedback(entry.id)}
                          className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white h-12 w-12 rounded-2xl p-0 shadow-lg shadow-blue-100 transition-all active:scale-90"
                        >
                          {submitting === entry.id ? <Loader2 className="animate-spin h-5 w-5" /> : <Send size={20} />}
                        </Button>
                     </div>
                   )}
                </div>
              </CardContent>
            </Card>
          ))}

          {dailyEntries.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                <Activity size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-black italic tracking-tight text-lg">Öğrenci henüz rapor girmedi.</p>
            </div>
          )}
        </div>

        {/* SAĞ KOLON: İLERLEME VE ANALİZ */}
        <div className="space-y-8">
          <h2 className="text-xl font-black flex items-center gap-2 px-2 tracking-tight"><Target className="text-blue-600" /> Haftalık İlerleme</h2>
          
          <Card className="bg-white rounded-[3rem] border-none shadow-sm p-10 text-center relative group">
              <div className="relative inline-flex items-center justify-center w-40 h-40 mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-50" />
                    <circle 
                      cx="80" cy="80" r="72" 
                      stroke="currentColor" strokeWidth="12" fill="transparent" 
                      strokeDasharray={452} 
                      strokeDashoffset={452 - (452 * odevStats.percent) / 100} 
                      className="text-blue-600 transition-all duration-1000 ease-out" 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <span className="absolute text-4xl font-black tracking-tighter">%{odevStats.percent}</span>
              </div>
              <div className="space-y-4 text-left border-t border-slate-50 pt-8 mt-4">
                <div className="flex justify-between items-center"><span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] italic">Ödevler</span><span className="font-black text-slate-900">{odevStats.total} Görev</span></div>
                <div className="flex justify-between items-center"><span className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em] italic">Biten</span><span className="font-black text-emerald-600">{odevStats.done} Tamamlanan</span></div>
                <div className="flex justify-between items-center"><span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.2em] italic">Soru</span><span className="font-black text-blue-600">{odevStats.questions} Soru</span></div>
              </div>
          </Card>

          <Card className="bg-slate-900 rounded-[3rem] border-none shadow-2xl p-8 text-white relative overflow-hidden group">
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                   <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 group-hover:bg-blue-600/30 transition-colors">
                      <BarChart3 size={24} className="text-blue-400" />
                   </div>
                   <h3 className="font-black text-xl tracking-tight">Koç Analizi</h3>
                </div>
                <div className="space-y-5">
                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 italic">Günlük Ortalama Odak</p>
                       <p className="text-3xl font-black tracking-tighter">
                          {dailyEntries.length > 0 ? Math.round(dailyEntries.reduce((acc, curr) => acc + (curr.total_duration_minutes || 0), 0) / dailyEntries.length) : 0} <span className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">dk</span>
                       </p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 flex justify-between items-center group/item hover:bg-white/10 transition-all">
                       <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 italic">Süreklilik</p>
                          <p className="text-2xl font-black text-emerald-400 tracking-tight">Yükselişte</p>
                       </div>
                       <TrendingUp className="text-emerald-400 group-hover/item:scale-125 transition-transform" size={32} />
                    </div>
                </div>
             </div>
             <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-blue-600/10 blur-[80px] rounded-full group-hover:bg-blue-600/20 transition-all duration-1000" />
          </Card>
        </div>
      </div>
    </div>
  );
}
