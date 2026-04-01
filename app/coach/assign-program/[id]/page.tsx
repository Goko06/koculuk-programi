'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, Save, Plus, Trash2, Calendar, 
  Target, Loader2, Clock
} from 'lucide-react';
import { toast } from 'sonner';

const DAYS = [
  { id: 'monday', label: 'Pazartesi' },
  { id: 'tuesday', label: 'Salı' },
  { id: 'wednesday', label: 'Çarşamba' },
  { id: 'thursday', label: 'Perşembe' },
  { id: 'friday', label: 'Cuma' },
  { id: 'saturday', label: 'Cumartesi' },
  { id: 'sunday', label: 'Pazar' },
];

export default function AssignProgramPage() {
  const params = useParams();
  const id = params?.id; 
  const router = useRouter();
  const supabase = createClient();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [programData, setProgramData] = useState<any>({
    monday: [], tuesday: [], wednesday: [], thursday: [], 
    friday: [], saturday: [], sunday: []
  });

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data: sData, error: sError } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
      
      if (sError) throw sError;
      setStudent(sData);

      const { data: pData } = await supabase
        .from('weekly_programs')
        .select('*')
        .eq('student_id', id)
        .order('week_start_date', { ascending: false })
        .limit(1)
        .single();
      
      if (pData?.program_data) setProgramData(pData.program_data);
    } catch (error) {
      console.error("Veri hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addTask = (day: string) => {
    const newTask = { subject: '', task_detail: '', goal_questions: 0, completed: false };
    setProgramData((prev: any) => ({ ...prev, [day]: [...(prev[day] || []), newTask] }));
  };

  const removeTask = (day: string, index: number) => {
    setProgramData((prev: any) => ({ ...prev, [day]: prev[day].filter((_: any, i: number) => i !== index) }));
  };

  const updateTask = (day: string, index: number, field: string, value: any) => {
    setProgramData((prev: any) => {
      const updatedDay = [...prev[day]];
      updatedDay[index] = { ...updatedDay[index], [field]: value };
      return { ...prev, [day]: updatedDay };
    });
  };

  // PROGRAMI KAYDET - coach_id hatası burada giderildi
  const handleSave = async () => {
    if (!id) return;
    
    setSaving(true);
    try {
      // 1. Giriş yapan koçun ID'sini alıyoruz
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");

      // 2. Programı koç ID'si ile birlikte kaydediyoruz
      const { error } = await supabase.from('weekly_programs').insert([{
        student_id: id,
        coach_id: user.id, // Hatayı çözen kritik satır
        program_data: programData,
        week_start_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      
      toast.success("Haftalık program başarıyla yayınlandı!");
      router.push(`/coach/student/${id}`);
    } catch (error: any) {
      toast.error("Kaydetme hatası: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Planlayıcı Hazırlanıyor...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-6">
          <Button variant="outline" onClick={() => router.back()} className="rounded-2xl h-14 w-14 p-0 shadow-sm border-slate-100"><ArrowLeft /></Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">Haftalık Program</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 italic">{student?.full_name}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-12 h-16 font-black shadow-xl shadow-blue-100 gap-3 text-lg transition-all active:scale-95">
          {saving ? <Loader2 className="animate-spin" /> : <Save size={24} />} Programı Yayınla
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 items-start">
        {DAYS.map((day) => (
          <div key={day.id} className="space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-[1.5rem] text-center font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                <Clock size={14} className="text-blue-400" /> {day.label}
            </div>
            
            <div className="space-y-4 min-h-[200px]">
              {programData[day.id]?.map((task: any, index: number) => (
                <Card key={index} className="bg-white border-none shadow-sm rounded-3xl overflow-hidden hover:border-blue-500/20 transition-all border-2 border-transparent">
                  <CardContent className="p-5 space-y-4">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Ders</Label>
                        <input 
                            placeholder="Ders adı..."
                            className="w-full font-bold text-sm bg-slate-50 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                            value={task.subject}
                            onChange={(e) => updateTask(day.id, index, 'subject', e.target.value)}
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Görev</Label>
                        <textarea 
                            placeholder="Ödev detayı..."
                            className="w-full text-xs font-medium bg-slate-50 border-none rounded-xl p-3 outline-none min-h-[70px] resize-none"
                            value={task.task_detail}
                            onChange={(e) => updateTask(day.id, index, 'task_detail', e.target.value)}
                        />
                    </div>

                    <div className="flex items-end justify-between gap-2 pt-2 border-t">
                       <div className="flex-1">
                          <Label className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1"><Target size={10} /> Hedef</Label>
                          <input 
                            type="number"
                            className="w-full bg-blue-50/50 border-none rounded-lg p-2 text-xs font-black text-blue-700 outline-none mt-1"
                            value={task.goal_questions}
                            onChange={(e) => updateTask(day.id, index, 'goal_questions', parseInt(e.target.value) || 0)}
                          />
                       </div>
                       <Button variant="ghost" onClick={() => removeTask(day.id, index)} className="h-10 w-10 p-0 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button 
                onClick={() => addTask(day.id)}
                variant="outline" 
                className="w-full border-dashed border-2 border-slate-200 rounded-[1.5rem] h-14 text-slate-400 hover:text-blue-600 hover:border-blue-500/30 transition-all gap-2 font-black text-xs uppercase"
              >
                <Plus size={18} /> Ödev Ekle
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
