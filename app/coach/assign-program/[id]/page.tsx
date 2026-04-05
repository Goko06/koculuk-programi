'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { 
  Plus, Trash2, Save, ArrowLeft, 
  LayoutGrid, Loader2, Sparkles, ClipboardCheck,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfWeek } from 'date-fns';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export default function AssignProgramPro() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [activeDay, setActiveDay] = useState('Pazartesi');
  const [programData, setProgramData] = useState<Record<string, any[]>>({
    'Pazartesi': [], 'Salı': [], 'Çarşamba': [], 'Perşembe': [], 'Cuma': [], 'Cumartesi': [], 'Pazar': []
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Öğrenci verisini çek
      const { data: sData } = await supabase.from('students').select('*').eq('id', id).single();
      setStudent(sData);

      // Mevcut programı çek
      const { data: pData } = await supabase.from('weekly_programs')
        .select('*')
        .eq('student_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pData?.program_data) {
        setProgramData({ 
          'Pazartesi': [], 'Salı': [], 'Çarşamba': [], 'Perşembe': [], 'Cuma': [], 'Cumartesi': [], 'Pazar': [], 
          ...pData.program_data 
        });
      }
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  }, [id, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Yeni Görev Satırı Ekleme (Görev Ata butonunun işlevi)
  const addTask = (day: string) => {
    const newTask = { 
      id: Math.random().toString(36).substr(2, 9), 
      subject: '', 
      title: '', 
      target_questions: '', 
      completed: false 
    };
    setProgramData(prev => ({ ...prev, [day]: [...(prev[day] || []), newTask] }));
    toast.info(`${day} gününe yeni satır eklendi.`);
  };

  const removeTask = (day: string, taskId: string) => {
    setProgramData(prev => ({ ...prev, [day]: (prev[day] || []).filter(t => t.id !== taskId) }));
  };

  const updateTask = (day: string, taskId: string, field: string, value: string) => {
    setProgramData(prev => ({ 
      ...prev, 
      [day]: (prev[day] || []).map(t => t.id === taskId ? { ...t, [field]: value } : t) 
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı.");

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      
      const { error } = await supabase.from('weekly_programs').upsert({
        student_id: id,
        coach_id: user?.id,
        week_start_date: format(weekStart, 'yyyy-MM-dd'),
        program_data: programData,
        created_by: user?.id
      });

      if (error) throw error;

      // Öğrenciye bildirim gönder
      await supabase.from('notifications').insert({
        user_id: id,
        title: "Yeni Program Yayınlandı! 📚",
        message: "Koçun bu haftaki çalışma programını güncelledi.",
        type: 'success'
      });

      toast.success("Program başarıyla yayınlandı! 🚀");
      router.push(`/coach/student/${id}`);
    } catch (error: any) { 
      toast.error("Hata: " + error.message); 
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 font-black text-blue-600 animate-pulse italic uppercase tracking-tighter">Planlayıcı Hazırlanıyor...</div>;

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 pb-32">
      {/* Üst Header Alanı */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-6">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-2xl w-14 h-14 p-0 bg-slate-50 hover:bg-slate-900 hover:text-white transition-all border border-slate-100"><ArrowLeft size={24} /></Button>
          <div>
            <h1 className="text-3xl font-black tracking-tighter italic uppercase leading-none">{student?.full_name}</h1>
            <p className="text-blue-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 mt-2 italic opacity-80"><Sparkles size={14} /> Haftalık Gelişim Programı</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full lg:w-auto bg-slate-900 hover:bg-blue-600 text-white rounded-[1.8rem] px-12 h-16 font-black text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3">
          {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Programı Kaydet & Yayınla</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sol Gün Menüsü */}
        <div className="lg:col-span-3 space-y-3">
          {DAYS.map((day) => (
            <button key={day} onClick={() => setActiveDay(day)} className={`w-full flex items-center justify-between p-6 rounded-[2rem] transition-all duration-500 font-black text-[12px] uppercase italic tracking-wider ${activeDay === day ? "bg-blue-600 text-white shadow-2xl shadow-blue-100 translate-x-2" : "bg-white text-slate-400 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-100"}`}>
              {day}
              <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-[10px] ${activeDay === day ? "bg-white/20 text-white" : "bg-slate-50 text-slate-400"}`}>{(programData[day] || []).length}</span>
            </button>
          ))}
        </div>

        {/* Orta Görev Listesi */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between px-6">
             <h2 className="text-2xl font-black tracking-tighter italic uppercase flex items-center gap-4 text-slate-800"><LayoutGrid className="text-blue-600" size={28} /> {activeDay} Programı</h2>
             <Button onClick={() => addTask(activeDay)} className="bg-white border border-slate-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl font-black transition-all gap-2 h-12 px-6 shadow-sm"><Plus size={20} /> Görev Ekle</Button>
          </div>

          <div className="space-y-4">
            {(programData[activeDay] || []).length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[4rem] border-4 border-dashed border-slate-50 flex flex-col items-center justify-center">
                 <div className="p-8 bg-slate-50 rounded-full mb-6 text-slate-200"><ClipboardCheck size={64} /></div>
                 <p className="text-slate-400 font-black italic uppercase tracking-widest text-xs">Bu gün henüz bir görev planlanmadı.</p>
                 <Button onClick={() => addTask(activeDay)} variant="link" className="text-blue-600 font-black mt-2 uppercase text-[10px]">İlk görevi oluştur</Button>
              </div>
            ) : (
              (programData[activeDay] || []).map((task) => (
                <Card key={task.id} className="bg-white border-none shadow-sm rounded-[2.5rem] p-8 border-l-[12px] border-l-blue-600 transition-all duration-500 hover:shadow-xl group">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                    <div className="md:col-span-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block italic ml-1 flex items-center gap-2"><Target size={12} className="text-blue-600"/> Branş</label>
                       <Input placeholder="Örn: Matematik" value={task.subject} onChange={(e) => updateTask(activeDay, task.id, 'subject', e.target.value)} className="rounded-2xl border-none font-bold bg-slate-50 h-14 px-6 focus:ring-2 focus:ring-blue-100 transition-all text-sm" />
                    </div>
                    <div className="md:col-span-5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block italic ml-1">Çalışılacak Konu / Görev</label>
                       <Input placeholder="Örn: Türev Giriş + 2 Test" value={task.title} onChange={(e) => updateTask(activeDay, task.id, 'title', e.target.value)} className="rounded-2xl border-none font-bold bg-slate-50 h-14 px-6 focus:ring-2 focus:ring-blue-100 transition-all text-sm" />
                    </div>
                    <div className="md:col-span-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block italic ml-1 text-center">Soru Hedefi</label>
                       <Input type="number" placeholder="0" value={task.target_questions} onChange={(e) => updateTask(activeDay, task.id, 'target_questions', e.target.value)} className="rounded-2xl border-none font-black bg-blue-50/50 text-blue-600 h-14 px-6 text-center focus:ring-2 focus:ring-blue-100 text-lg" />
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                       <Button onClick={() => removeTask(activeDay, task.id)} variant="ghost" className="w-14 h-14 rounded-2xl text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100"><Trash2 size={20} /></Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
