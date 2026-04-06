'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2, Circle, Calendar, LayoutGrid, Check,
  MessageSquare, Send, Sparkles, ChevronLeft, ChevronRight, Target
} from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export default function StudentProgram() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  
  // Hafta navigasyonu için state
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  const supabase = createClient();

  // Seçili haftanın 7 gününü hesapla
  const weekDays = DAYS.map((_, index) => addDays(currentWeekStart, index));

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('student_tasks')
        .select('*')
        .eq('student_id', user.id);

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast.error("Program yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskAction = async (taskId: string, newStatus: string, note?: string) => {
    try {
      const { error } = await supabase
        .from('student_tasks')
        .update({
          status: newStatus,
          student_note: note || null,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;
      toast.success(newStatus === 'completed' ? "Görev tamamlandı! 🎉" : "Geri alındı.");
      setIsNoteModalOpen(false);
      setCompletionNote('');
      fetchTasks(); 
    } catch (error) {
      toast.error("İşlem başarısız.");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-xs uppercase italic tracking-[0.3em]">Haftalık Plan Yükleniyor...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 pb-32">
      
      {/* Üst Navigasyon & Hafta Seçici */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl rotate-3"><Calendar size={28} /></div>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Haftalık Programım</h1>
            <p className="text-blue-600 font-bold text-[10px] uppercase tracking-widest mt-2 italic">
              {format(weekDays[0], 'dd MMM')} - {format(weekDays[6], 'dd MMM yyyy', { locale: tr })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center bg-slate-100 p-2 rounded-2xl gap-2">
          <Button onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))} variant="ghost" className="h-12 w-12 rounded-xl bg-white shadow-sm hover:bg-slate-900 hover:text-white transition-all">
            <ChevronLeft size={20} />
          </Button>
          <div className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Hafta Değiştir</div>
          <Button onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))} variant="ghost" className="h-12 w-12 rounded-xl bg-white shadow-sm hover:bg-slate-900 hover:text-white transition-all">
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      {/* 7 GÜNLÜK GRID GÖRÜNÜMÜ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4">
        {weekDays.map((date, index) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayTasks = tasks.filter(t => t.due_date === dateStr);
          const isToday = isSameDay(date, new Date());

          return (
            <div key={index} className={`flex flex-col gap-4 min-h-[500px] p-4 rounded-[2.5rem] transition-all ${isToday ? 'bg-blue-50/50 ring-2 ring-blue-100' : 'bg-slate-100/30'}`}>
              {/* Gün Başlığı */}
              <div className={`p-5 rounded-[2rem] text-center shadow-sm ${isToday ? 'bg-slate-900 text-white shadow-blue-100' : 'bg-white text-slate-400'}`}>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1">{DAYS[index].substring(0, 3)}</p>
                <p className="text-2xl font-black italic tracking-tighter leading-none">{format(date, 'dd')}</p>
              </div>

              {/* Günlük Görevler */}
              <div className="space-y-3 flex-1">
                {dayTasks.length > 0 ? (
                  dayTasks.map((task) => (
                    <Card
                      key={task.id}
                      onClick={() => {
                        if (task.status === 'completed') handleTaskAction(task.id, 'pending');
                        else { setSelectedTask(task); setIsNoteModalOpen(true); }
                      }}
                      className={`group rounded-3xl border-none shadow-sm cursor-pointer transition-all hover:scale-[1.03] ${
                        task.status === 'completed' ? 'bg-emerald-50 opacity-60' : 'bg-white hover:shadow-xl'
                      }`}
                    >
                      <CardContent className="p-5 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className={`p-2 rounded-xl ${task.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-300 group-hover:text-blue-600'}`}>
                            {task.status === 'completed' ? <Check size={14} strokeWidth={4} /> : <Target size={14} />}
                          </div>
                          <span className="text-[14px] font-black italic text-slate-900">{task.target_questions} <span className="text-[8px] uppercase not-italic text-slate-400">Soru</span></span>
                        </div>
                        <h4 className={`text-[11px] font-black uppercase leading-tight tracking-tight ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {task.topic_name}
                        </h4>
                        {task.student_note && (
                          <div className="pt-2 border-t border-slate-100">
                             <p className="text-[8px] font-bold text-slate-400 italic line-clamp-1">"{task.student_note}"</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 py-10">
                    <Circle size={32} className="mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Boş</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Onay Modalı */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <div className="bg-slate-900 p-8 text-white relative">
             <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Sparkles size={100} /></div>
             <DialogTitle className="text-xl font-black italic uppercase tracking-tighter">Görevi Tamamla</DialogTitle>
          </div>
          <div className="p-8 space-y-6">
            <Textarea
              placeholder="Koçuna bir not bırakmak ister misin? (Opsiyonel)"
              className="min-h-[120px] rounded-2xl bg-slate-50 border-none font-bold p-5 outline-none focus:ring-2 ring-blue-500/20 text-sm shadow-inner"
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
            />
            <Button onClick={() => handleTaskAction(selectedTask.id, 'completed', completionNote)} className="w-full h-16 bg-blue-600 hover:bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-100 flex items-center justify-center gap-2 transition-all">
              <Send size={18} /> GÖREVİ BİTİR VE GÖNDER
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
