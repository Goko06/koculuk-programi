'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { 
  Plus, Trash2, Save, ArrowLeft, Calendar, 
  LayoutGrid, Loader2, Sparkles, ClipboardCheck,
  TrendingUp, AlertCircle, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfWeek } from 'date-fns';
import { tr } from 'date-fns/locale';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export default function AssignProgramPro() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [lastExam, setLastExam] = useState<any>(null);
  const [activeDay, setActiveDay] = useState('Pazartesi');
  const [programData, setProgramData] = useState<Record<string, any[]>>({
    'Pazartesi': [], 'Salı': [], 'Çarşamba': [], 'Perşembe': [], 'Cuma': [], 'Cumartesi': [], 'Pazar': []
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: sData } = await supabase.from('students').select('*').eq('id', id).single();
      setStudent(sData);

      const { data: eData } = await supabase.from('exams').select('*').eq('student_id', id).order('exam_date', { ascending: false }).limit(1).maybeSingle();
      setLastExam(eData);

      const { data: pData } = await supabase.from('weekly_programs').select('*').eq('student_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (pData?.program_data) {
        setProgramData({ 'Pazartesi': [], 'Salı': [], 'Çarşamba': [], 'Perşembe': [], 'Cuma': [], 'Cumartesi': [], 'Pazar': [], ...pData.program_data });
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [id, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addTask = (day: string) => {
    const newTask = { id: Math.random().toString(36).substr(2, 9), subject: '', title: '', target_questions: '', completed: false };
    setProgramData(prev => ({ ...prev, [day]: [...(prev[day] || []), newTask] }));
  };

  const removeTask = (day: string, taskId: string) => {
    setProgramData(prev => ({ ...prev, [day]: (prev[day] || []).filter(t => t.id !== taskId) }));
  };

  const updateTask = (day: string, taskId: string, field: string, value: string) => {
    setProgramData(prev => ({ ...prev, [day]: (prev[day] || []).map(t => t.id === taskId ? { ...t, [field]: value } : t) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      
      const { error } = await supabase.from('weekly_programs').upsert({
        student_id: id, coach_id: user?.id, week_start_date: format(weekStart, 'yyyy-MM-dd'), program_data: programData, created_by: user?.id
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: id, title: "Yeni Program! 📚", message: "Koçun haftalık çalışma programını hazırladı.", type: 'success'
      });

      toast.success("Program yayınlandı! 🚀");
      router.push(`/coach/student/${id}`);
    } catch (error: any) { toast.error("Hata: " + error.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 font-black text-blue-600 animate-pulse">YÜKLENİYOR...</div>;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full w-12 h-12 p-0 bg-slate-100 hover:bg-blue-600 hover:text-white transition-all"><ArrowLeft size={24} /></Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{student?.full_name} Planlayıcı</h1>
            <p className="text-blue-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 italic"><Sparkles size={14} /> Performans Odaklı Programlama</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full lg:w-auto bg-slate-900 hover:bg-blue-600 text-white rounded-2xl px-10 h-16 font-black text-lg shadow-2xl shadow-slate-200 flex items-center gap-3">
          {saving ? <Loader2 className="animate-spin" /> : <><Save size={22} /> Programı Yayınla</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {DAYS.map((day) => (
            <button key={day} onClick={() => setActiveDay(day)} className={`w-full flex items-center justify-between p-5 rounded-[1.8rem] transition-all duration-300 font-black text-sm ${activeDay === day ? "bg-blue-600 text-white shadow-xl shadow-blue-100 translate-x-2" : "bg-white text-slate-400 hover:bg-blue-50 hover:text-blue-600"}`}>
              {day.substring(0, 3)}
              <span className={`text-[10px] px-2 py-1 rounded-lg ${activeDay === day ? "bg-white/20" : "bg-slate-100 text-slate-400"}`}>{(programData[day] || []).length}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-4">
             <h2 className="text-2xl font-black tracking-tight italic flex items-center gap-3"><LayoutGrid className="text-blue-600" /> {activeDay} Planı</h2>
             <Button onClick={() => addTask(activeDay)} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl font-black transition-all gap-2 h-10 px-4"><Plus size={18} /> Yeni Görev</Button>
          </div>

          <div className="space-y-4">
            {(programData[activeDay] || []).length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
                 <ClipboardCheck size={64} className="mx-auto text-slate-100 mb-4" />
                 <p className="text-slate-400 font-bold italic">Bugün için bir görev planı yok.</p>
              </div>
            ) : (
              (programData[activeDay] || []).map((task) => (
                <Card key={task.id} className="bg-white border-none shadow-sm rounded-[2rem] p-6 border-l-8 border-l-blue-600 transition-all hover:shadow-md">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-3">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block italic ml-1">Branş</label>
                       <Input placeholder="Matematik..." value={task.subject} onChange={(e) => updateTask(activeDay, task.id, 'subject', e.target.value)} className="rounded-xl border-slate-100 font-bold bg-slate-50 h-12" />
                    </div>
                    <div className="md:col-span-5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block italic ml-1">Konu Başlığı</label>
                       <Input placeholder="Fonksiyonlar Soru Çözümü" value={task.title} onChange={(e) => updateTask(activeDay, task.id, 'title', e.target.value)} className="rounded-xl border-slate-100 font-bold bg-slate-50 h-12" />
                    </div>
                    <div className="md:col-span-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block italic ml-1">Hedef Soru</label>
                       <Input type="number" placeholder="60" value={task.target_questions} onChange={(e) => updateTask(activeDay, task.id, 'target_questions', e.target.value)} className="rounded-xl border-slate-100 font-bold bg-slate-50 h-12" />
                    </div>
                    <div className="md:col-span-2 flex justify-end pt-4">
                       <Button onClick={() => removeTask(activeDay, task.id)} variant="ghost" className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl w-12 h-12 p-0"><Trash2 size={20} /></Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-4 flex items-center gap-2"><BarChart3 size={14} className="text-orange-500" /> Performans Analizi</h3>
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-6 relative overflow-hidden group">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Son Deneme Neti</p>
            <h3 className="text-4xl font-black text-slate-900">{lastExam?.total_net || '0'}</h3>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-orange-500/5 blur-2xl rounded-full" />
          </Card>
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 p-8 text-white">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2 italic"><AlertCircle size={14} className="text-amber-400" /> Zayıf Branşlar</h4>
            <div className="space-y-4">
              {lastExam?.results_data ? Object.entries(lastExam.results_data).sort(([, a]: any, [, b]: any) => a.n - b.n).slice(0, 2).map(([lesson, data]: any) => (
                <div key={lesson} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all">
                  <span className="text-xs font-black uppercase italic text-slate-300">{lesson}</span>
                  <span className="text-sm font-black text-red-400">{data.n.toFixed(1)} Net</span>
                </div>
              )) : <p className="text-xs font-bold text-slate-500 italic">Veri bulunamadı.</p>}
            </div>
          </Card>
          <div className="bg-blue-600/5 border border-blue-600/10 rounded-[2.5rem] p-6 relative group overflow-hidden">
             <Sparkles size={20} className="text-blue-600 mb-3 animate-pulse" />
             <p className="text-xs font-black text-blue-900 leading-relaxed italic">"Öğrencinin son deneme performansına göre bu haftayı branş odaklı geçirebilirsin."</p>
          </div>
        </div>
      </div>
    </div>
  );
}
