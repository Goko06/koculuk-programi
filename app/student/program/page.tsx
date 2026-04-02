'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle, Calendar, Loader2, LayoutGrid, Check } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export default function StudentProgram() {
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [activeDay, setActiveDay] = useState('Pazartesi');
  const supabase = createClient();

  const fetchProgram = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from('weekly_programs').select('*').eq('student_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (data) {
        setProgram(data);
        const today = format(new Date(), 'EEEE', { locale: tr });
        const matchedDay = DAYS.find(d => d.toLowerCase() === today.toLowerCase());
        if (matchedDay) setActiveDay(matchedDay);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [supabase]);

  useEffect(() => { fetchProgram(); }, [fetchProgram]);

  const toggleTask = async (day: string, taskId: string) => {
    if (!program) return;
    const { data: { user } } = await supabase.auth.getUser();
    const currentTask = (program.program_data[day] || []).find((t: any) => t.id === taskId);
    if (!currentTask || !user) return;

    const isNowCompleted = !currentTask.completed;
    const updatedData = { ...program.program_data };
    updatedData[day] = (updatedData[day] || []).map((t: any) => t.id === taskId ? { ...t, completed: isNowCompleted } : t);

    const { error } = await supabase.from('weekly_programs').update({ program_data: updatedData }).eq('id', program.id);

    if (!error) {
      setProgram({ ...program, program_data: updatedData });
      if (isNowCompleted) { 
          await supabase.from('notifications').insert({
            user_id: program.coach_id, title: "Görev Tamamlandı! ✅", message: `${user.user_metadata?.full_name || 'Öğrencin'}, ${currentTask.subject} dersinden bir görev bitirdi.`, type: 'success'
          });
      }
      toast.success(isNowCompleted ? "Görev Tamamlandı! 🎉" : "Geri Alındı");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 font-black text-blue-600 animate-pulse italic uppercase tracking-widest">YÜKLENİYOR...</div>;

  const currentDayTasks = program?.program_data?.[activeDay] || [];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600 rounded-[1.5rem] text-white shadow-xl shadow-blue-100"><Calendar size={28} /></div>
          <div><h1 className="text-2xl font-black tracking-tight">Haftalık Planım</h1><p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic mt-1">{format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'dd MMMM', { locale: tr })} Haftası</p></div>
        </div>
        <div className="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 text-center"><p className="text-[10px] font-black text-blue-600 uppercase mb-1 italic">Kalan İş</p><p className="text-xl font-black text-slate-900">{currentDayTasks.filter((t: any) => !t.completed).length} Görev</p></div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {DAYS.map((day) => (
          <button key={day} onClick={() => setActiveDay(day)} className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap border ${activeDay === day ? "bg-slate-900 text-white border-slate-900 shadow-xl" : "bg-white text-slate-400 border-slate-100 hover:bg-blue-50"}`}>{day}</button>
        ))}
      </div>

      <div className="space-y-4">
        {currentDayTasks.length === 0 ? (
          <Card className="rounded-[3rem] border-none shadow-sm p-24 text-center bg-white border border-dashed border-slate-200">
            <LayoutGrid size={48} className="mx-auto text-slate-100 mb-6" />
            <p className="text-slate-400 font-black italic">Bu gün için atanmış bir görev bulunmuyor.</p>
          </Card>
        ) : (
          currentDayTasks.map((task: any) => (
            <Card key={task.id} onClick={() => toggleTask(activeDay, task.id)} className={`rounded-[2.5rem] border-none shadow-sm transition-all cursor-pointer relative overflow-hidden group ${task.completed ? "bg-emerald-50/50" : "bg-white hover:shadow-xl hover:scale-[1.01]"}`}>
              {task.completed && <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500" />}
              <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6 flex-1">
                  <div className={`transition-all ${task.completed ? "text-emerald-500 scale-110" : "text-slate-200 group-hover:text-blue-600"}`}>
                    {task.completed ? <div className="bg-emerald-500 p-2 rounded-full text-white"><Check size={24} strokeWidth={4} /></div> : <Circle size={36} strokeWidth={2.5} />}
                  </div>
                  <div className="space-y-1">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${task.completed ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-100"}`}>{task.subject}</span>
                    <h3 className={`text-xl font-black tracking-tight ${task.completed ? "text-slate-400 line-through italic" : "text-slate-900"}`}>{task.title}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-8 w-full md:w-auto">
                  {task.target_questions && <div className="text-right"><p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{task.target_questions} <span className="text-xs font-bold text-slate-400 ml-1 uppercase">Soru</span></p><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Hedeflenen</p></div>}
                  <div className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase border tracking-widest ${task.completed ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-400 border-slate-100"}`}>{task.completed ? "Tamamlandı" : "Tamamla"}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
