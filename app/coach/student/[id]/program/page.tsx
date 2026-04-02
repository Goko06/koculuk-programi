'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, CheckCircle2, Circle, Calendar, 
  LayoutGrid, Loader2, Target, Clock 
} from 'lucide-react';
import { format, startOfWeek } from 'date-fns';
import { tr } from 'date-fns/locale';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export default function CoachStudentProgramView() {
  const { id } = useParams(); // Öğrenci ID
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [program, setProgram] = useState<any>(null);
  const [activeDay, setActiveDay] = useState('Pazartesi');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Öğrenci Bilgisi
      const { data: sData } = await supabase.from('students').select('*').eq('id', id).single();
      setStudent(sData);

      // 2. En Güncel Programı Çek
      const { data: pData } = await supabase
        .from('weekly_programs')
        .select('*')
        .eq('student_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pData) {
        setProgram(pData);
        // Otomatik bugünü seç
        const today = format(new Date(), 'EEEE', { locale: tr });
        const matchedDay = DAYS.find(d => d.toLowerCase() === today.toLowerCase());
        if (matchedDay) setActiveDay(matchedDay);
      }
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50 font-black text-blue-600 animate-pulse">
      PROGRAM DETAYLARI YÜKLENİYOR...
    </div>
  );

  const currentDayTasks = program?.program_data?.[activeDay] || [];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      
      {/* ÜST PANEL */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full w-12 h-12 p-0 bg-slate-100 hover:bg-blue-600 hover:text-white transition-all">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{student?.full_name}</h1>
            <p className="text-blue-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2 italic">
               <Calendar size={14} /> Haftalık Program Detayı
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-center shadow-xl">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Toplam Görev</p>
              <p className="text-xl font-black">{currentDayTasks.length}</p>
           </div>
           <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl text-center border border-emerald-100">
              <p className="text-[10px] font-black uppercase mb-1">Tamamlanan</p>
              <p className="text-xl font-black">{currentDayTasks.filter((t:any) => t.completed).length}</p>
           </div>
        </div>
      </div>

      {/* GÜN SEÇİCİ */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap border ${
              activeDay === day 
              ? "bg-blue-600 text-white border-blue-600 shadow-xl" 
              : "bg-white text-slate-400 border-slate-100 hover:bg-blue-50 hover:text-blue-600"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* GÖREV LİSTESİ (KOÇ GÖRÜNÜMÜ - SADECE OKUMA) */}
      <div className="space-y-4">
        {!program ? (
          <Card className="rounded-[3rem] border-none shadow-sm p-24 text-center bg-white border border-dashed border-slate-200">
            <LayoutGrid size={48} className="mx-auto text-slate-100 mb-6" />
            <p className="text-slate-400 font-black italic">Bu öğrenciye henüz bir program atanmamış.</p>
            <Button 
              onClick={() => router.push(`/coach/assign-program/${id}`)}
              className="mt-6 bg-blue-600 text-white rounded-xl font-bold px-6"
            >Hemen Program Oluştur</Button>
          </Card>
        ) : currentDayTasks.length === 0 ? (
          <Card className="rounded-[3rem] border-none shadow-sm p-20 text-center bg-white">
             <Clock size={40} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-black italic text-lg">{activeDay} günü için görev bulunmuyor.</p>
          </Card>
        ) : (
          currentDayTasks.map((task: any) => (
            <Card 
              key={task.id} 
              className={`rounded-[2.5rem] border-none shadow-sm transition-all relative overflow-hidden ${
                task.completed ? "bg-emerald-50/30 opacity-80" : "bg-white"
              }`}
            >
              {task.completed && <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500" />}
              
              <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6 flex-1">
                  <div className={`${task.completed ? "text-emerald-500" : "text-slate-200"}`}>
                    {task.completed ? (
                      <CheckCircle2 size={36} fill="currentColor" className="text-white bg-emerald-500 rounded-full" />
                    ) : (
                      <Circle size={36} strokeWidth={2.5} />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${
                      task.completed ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-100"
                    }`}>
                      {task.subject}
                    </span>
                    <h3 className={`text-xl font-black tracking-tight ${
                      task.completed ? "text-slate-400 italic" : "text-slate-900"
                    }`}>
                      {task.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-8 w-full md:w-auto">
                  {task.target_questions && (
                    <div className="text-right">
                      <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
                        {task.target_questions} 
                        <span className="text-xs font-bold text-slate-400 ml-1 uppercase">Soru</span>
                      </p>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Koç Hedefi</p>
                    </div>
                  )}
                  
                  <div className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border ${
                    task.completed 
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-lg" 
                    : "bg-slate-50 text-slate-400 border-slate-100"
                  }`}>
                    {task.completed ? "Öğrenci Bitirdi" : "Beklemede"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
