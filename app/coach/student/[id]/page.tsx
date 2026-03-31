'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, CheckCircle2, Clock, BarChart3, Loader2, 
  BookOpen, Smile, MessageSquare, Target, Activity 
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
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Öğrenci Bilgisi
      const { data: sData } = await supabase.from('students').select('*').eq('id', id).single();
      setStudent(sData);

      // 2. Haftalık Ödev Programı
      const { data: pData } = await supabase.from('weekly_programs').select('*').eq('student_id', id).order('week_start_date', { ascending: false }).limit(1).single();
      setLatestProgram(pData || null);

      // 3. Günlük Detaylı Çalışmalar (subjects_data içeren tablo)
      const { data: dData } = await supabase.from('daily_entries').select('*').eq('student_id', id).order('entry_date', { ascending: false }).limit(10);
      setDailyEntries(dData || []);

    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [id, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Ödev İstatistikleri
  const odevStats = (() => {
    if (!latestProgram?.program_data) return { total: 0, done: 0, questions: 0, percent: 0 };
    let t = 0, d = 0, q = 0;
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
      (latestProgram.program_data[day] || []).forEach((l: any) => {
        t++; if (l.completed) { d++; q += (l.solved_questions || 0); }
      });
    });
    return { total: t, done: d, questions: q, percent: t > 0 ? Math.round((d / t) * 100) : 0 };
  })();

  if (loading) return <div className="flex flex-col items-center justify-center min-h-screen bg-white"><Loader2 className="animate-spin text-blue-600 h-10 w-10 mb-2" /><p className="text-slate-500 font-medium">Veriler Analiz Ediliyor...</p></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900">
      <Button variant="outline" onClick={() => router.back()} className="gap-2 bg-white border-slate-200 shadow-sm"><ArrowLeft size={18} /> Geri Dön</Button>

      {/* PROFIL KARTI */}
      <Card className="bg-white border-none shadow-sm rounded-[2rem] p-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl uppercase">{student?.full_name?.charAt(0)}</div>
            <div><h1 className="text-3xl font-bold text-slate-900">{student?.full_name}</h1><p className="text-slate-500 font-medium">{student?.grade_level}. Sınıf • {student?.email}</p></div>
          </div>
          <div className="flex gap-4">
            <div className="bg-blue-50 p-4 px-6 rounded-2xl border border-blue-100 text-center"><p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Haftalık Soru</p><p className="text-2xl font-black">{odevStats.questions}</p></div>
            <div className="bg-emerald-50 p-4 px-6 rounded-2xl border border-emerald-100 text-center"><p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Ödev Başarısı</p><p className="text-2xl font-black">%{odevStats.percent}</p></div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SOL: GÜNLÜK ÇALIŞMA DETAYLARI (Subjects Data) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2"><Activity className="text-blue-600" /> Detaylı Günlük Raporlar</h2>
          {dailyEntries.map((entry) => (
            <Card key={entry.id} className="bg-white rounded-3xl border-none shadow-sm overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{entry.mood}</span>
                  <span className="font-bold">{format(new Date(entry.entry_date), 'dd MMMM EEEE', { locale: tr })}</span>
                </div>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{entry.total_duration_minutes} dk Çalışma</span>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(entry.subjects_data || []).map((sub: any, idx: number) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800">{sub.subject}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{sub.duration} dk</span>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">D: {sub.correct}</span>
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">Y: {sub.wrong}</span>
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">B: {sub.blank}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic">Kaynak: {sub.source}</p>
                    </div>
                  ))}
                </div>
                {entry.general_note && (
                  <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-2">
                    <MessageSquare size={16} className="text-amber-600 shrink-0 mt-1" />
                    <p className="text-sm text-amber-900 italic">"{entry.general_note}"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {dailyEntries.length === 0 && <p className="text-slate-400 italic">Öğrenci henüz günlük rapor girişi yapmadı.</p>}
        </div>

        {/* SAĞ: ÖDEV DURUMU VE ANALİZ */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2"><Target className="text-blue-600" /> Haftalık Ödev Özeti</h2>
          <Card className="bg-white rounded-3xl border-none shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2"><span>Ödev İlerlemesi</span><span>%{odevStats.percent}</span></div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden"><div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${odevStats.percent}%` }} /></div>
              </div>
              <div className="space-y-3 pt-4 border-t text-sm font-medium">
                <div className="flex justify-between"><span>Atanan Ödevler:</span><span className="font-bold">{odevStats.total}</span></div>
                <div className="flex justify-between text-emerald-600"><span>Biten:</span><span className="font-bold">{odevStats.done}</span></div>
                <div className="flex justify-between text-blue-600"><span>Ödev Soru Sayısı:</span><span className="font-bold">{odevStats.questions}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
