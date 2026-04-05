'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle2, Circle, Calendar, Loader2, LayoutGrid, Check, 
  MessageSquare, Send, Clock, AlertCircle, Sparkles, ChevronRight 
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
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
  const [activeDay, setActiveDay] = useState(format(new Date(), 'EEEE', { locale: tr }));

  const supabase = createClient();

  // Tarihleri hesapla (Haftalık görünüm için)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = DAYS.map((_, index) => addDays(weekStart, index));

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // student_tasks tablosundan mevcut haftanın görevlerini çek
      const { data, error } = await supabase
        .from('student_tasks')
        .select('*')
        .eq('student_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);

    } catch (error) {
      console.error('Görev yükleme hatası:', error);
      toast.error("Görevler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskClick = (task: any) => {
    if (task.status === 'completed') {
      // Zaten tamamlanmışsa geri al (opsiyonel)
      toggleTaskStatus(task.id, 'pending');
    } else {
      // Tamamlanmamışsa not modalını aç
      setSelectedTask(task);
      setIsNoteModalOpen(true);
    }
  };

  const toggleTaskStatus = async (taskId: string, newStatus: string, note?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Oturum bulunamadı.");

    // 1. Görevi Güncelle
    const { error: updateError } = await supabase
      .from('student_tasks')
      .update({ 
        status: newStatus,
        student_note: note || null,
        // completed_at sütunu yoksa hata almamak için şimdilik göndermeyebilirsin 
        // ama SQL'i çalıştırdıysan kalsın:
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', taskId);

    if (updateError) throw updateError;

    // 2. Eğer tamamlandıysa Koça Bildirim Gönder
    if (newStatus === 'completed') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('coach_id, full_name')
        .eq('id', user.id)
        .single();
      
      if (profile?.coach_id) {
        await supabase.from('notifications').insert([{
          user_id: profile.coach_id,
          title: "Ödev Tamamlandı! ✅",
          message: `${profile.full_name}, "${selectedTask?.topic_name || 'Bir ödev'}" ödevini bitirdi. ${note ? 'Not: ' + note : ''}`,
          type: 'success',
          is_read: false
        }]);
      }
      toast.success("Tebrikler! Görev koçuna bildirildi. 🎉");
    } else {
      toast.success("Görev durumu güncellendi.");
    }

    setIsNoteModalOpen(false);
    setCompletionNote('');
    fetchTasks(); // Listeyi yenile
  } catch (error: any) {
    console.error('Update Error:', error);
    toast.error("İşlem başarısız oldu: " + (error.message || "Bilinmeyen hata"));
  }
};

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 font-black text-blue-600 animate-pulse italic uppercase tracking-widest text-xs">ANALİZ EDİLİYOR...</div>;

  // Aktif güne ait görevleri filtrele
  const currentDayTasks = tasks.filter(task => {
    const taskDate = new Date(task.due_date);
    const selectedDayDate = weekDays[DAYS.indexOf(activeDay)];
    return isSameDay(taskDate, selectedDayDate);
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 font-sans pb-32">
      
      {/* Header Kısmı */}
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Calendar size={120} /></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-5 bg-blue-600 rounded-[2rem] text-white shadow-xl shadow-blue-100 rotate-3"><Calendar size={32} /></div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Haftalık Planım</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest italic mt-2 opacity-70">Bugün: {format(new Date(), 'dd MMMM yyyy', { locale: tr })}</p>
          </div>
        </div>
        <div className="bg-slate-900 px-8 py-5 rounded-[2rem] text-center shadow-2xl relative z-10">
           <p className="text-[10px] font-black text-blue-400 uppercase mb-1 italic tracking-widest">Kalan Görevler</p>
           <p className="text-3xl font-black text-white italic leading-none">{currentDayTasks.filter(t => t.status !== 'completed').length}</p>
        </div>
      </div>

      {/* Gün Seçici (Tarihlerle Birlikte) */}
      <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
        {weekDays.map((date, index) => {
          const dayName = DAYS[index];
          const isActive = activeDay === dayName;
          return (
            <button 
              key={dayName} 
              onClick={() => setActiveDay(dayName)} 
              className={`flex flex-col items-center min-w-[100px] px-6 py-5 rounded-[2rem] transition-all border-2 ${
                isActive 
                ? "bg-slate-900 text-white border-slate-900 shadow-2xl scale-105" 
                : "bg-white text-slate-400 border-transparent hover:border-blue-100 hover:bg-blue-50/30 shadow-sm"
              }`}
            >
              <span className="text-[9px] font-black uppercase tracking-[0.2em] mb-1">{dayName.substring(0, 3)}</span>
              <span className="text-lg font-black italic tracking-tighter">{format(date, 'dd')}</span>
            </button>
          );
        })}
      </div>

      {/* Görev Listesi */}
      <div className="space-y-4">
        {currentDayTasks.length === 0 ? (
          <Card className="rounded-[3.5rem] border-none shadow-sm p-32 text-center bg-white border border-dashed border-slate-200">
            <LayoutGrid size={64} className="mx-auto text-slate-100 mb-6 opacity-50" />
            <p className="text-slate-300 font-black italic uppercase tracking-widest text-xs">Bu tarih için atanmış ödevin bulunmuyor.</p>
          </Card>
        ) : (
          currentDayTasks.map((task) => (
            <Card 
              key={task.id} 
              onClick={() => handleTaskClick(task)}
              className={`rounded-[2.5rem] border-none shadow-sm transition-all cursor-pointer relative overflow-hidden group border border-transparent ${
                task.status === 'completed' 
                ? "bg-emerald-50/40 border-emerald-100 opacity-80" 
                : "bg-white hover:shadow-2xl hover:scale-[1.01] hover:border-blue-100"
              }`}
            >
              <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-8 flex-1">
                  <div className={`transition-all duration-500 ${task.status === 'completed' ? "text-emerald-500 rotate-[360deg]" : "text-slate-200 group-hover:text-blue-500"}`}>
                    {task.status === 'completed' 
                      ? <div className="bg-emerald-500 p-3 rounded-full text-white shadow-lg shadow-emerald-100"><Check size={28} strokeWidth={4} /></div> 
                      : <Circle size={48} strokeWidth={2.5} />
                    }
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        task.status === 'completed' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-100"
                      }`}>{task.topic_name.split('-')[0]}</span>
                      {task.student_note && <MessageSquare size={14} className="text-blue-400 animate-pulse" />}
                    </div>
                    <h3 className={`text-2xl font-black tracking-tighter italic uppercase ${task.status === 'completed' ? "text-slate-400 line-through opacity-50" : "text-slate-900"}`}>
                      {task.topic_name.split('-')[1] || task.topic_name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-10 w-full md:w-auto border-t md:border-t-0 pt-6 md:pt-0 border-slate-50">
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                      {task.target_questions} <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase italic tracking-widest">Soru</span>
                    </p>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2">Hedeflenen</p>
                  </div>
                  <div className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase border tracking-[0.2em] transition-all ${
                    task.status === 'completed' 
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-100" 
                    : "bg-slate-900 text-white border-slate-900 group-hover:bg-blue-600 group-hover:border-blue-600 shadow-xl"
                  }`}>
                    {task.status === 'completed' ? "BİTTİ" : "TAMAMLA"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Tamamlama Notu Modalı */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
             <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12"><Sparkles size={120} /></div>
             <DialogHeader>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                   <CheckCircle2 className="text-blue-400" /> Görevi Bitir
                </DialogTitle>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70 italic">Koçuna performansın hakkında bilgi ver</p>
             </DialogHeader>
          </div>
          <div className="p-10 space-y-6 bg-white">
             <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest italic">Öğrenci Notu (Opsiyonel)</label>
                <Textarea 
                  placeholder="Örn: Sorular biraz zordu ama hepsini bitirdim. / 20 soru eksik kaldı..."
                  className="min-h-[120px] rounded-[1.5rem] bg-slate-50 border-none font-bold p-6 focus-visible:ring-2 ring-blue-500/20 transition-all text-sm"
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                />
             </div>
             <div className="flex gap-3">
                <Button 
                  onClick={() => setIsNoteModalOpen(false)} 
                  variant="ghost" 
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-50 hover:text-red-500 transition-all"
                >İptal</Button>
                <Button 
                  onClick={() => toggleTaskStatus(selectedTask.id, 'completed', completionNote)}
                  className="flex-[2] h-14 bg-blue-600 hover:bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                >
                   Görevi Tamamla <Send size={16} />
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
