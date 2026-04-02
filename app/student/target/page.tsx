'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  School, Target, Rocket, Loader2, 
  ArrowLeft, GraduationCap, Flame, LayoutGrid,
  Zap, BarChart3, Trophy
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function StudentTargetPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState<any>(null);
  const [avgs, setAvgs] = useState({ tyt: 0, ayt: 0 });
  
  const [formData, setFormData] = useState({ 
    university: '', 
    department: '', 
    program_type: '4-yillik',
    target_net_tyt: '', 
    target_net_ayt: '' 
  });
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: tData } = await supabase.from('student_targets').select('*').eq('student_id', user.id).maybeSingle();
        if (tData) {
          setTarget(tData);
          setFormData({ 
            university: tData.university_name, 
            department: tData.department_name, 
            program_type: tData.program_type,
            target_net_tyt: tData.target_net_tyt.toString(), 
            target_net_ayt: tData.target_net_ayt?.toString() || '' 
          });
        }

        const { data: eData } = await supabase.from('exams').select('total_net, exam_type').eq('student_id', user.id);
        if (eData) {
          const tytExams = eData.filter(e => e.exam_type === 'TYT');
          const aytExams = eData.filter(e => e.exam_type === 'AYT');
          setAvgs({
            tyt: tytExams.length > 0 ? Number((tytExams.reduce((acc, curr) => acc + curr.total_net, 0) / tytExams.length).toFixed(1)) : 0,
            ayt: aytExams.length > 0 ? Number((aytExams.reduce((acc, curr) => acc + curr.total_net, 0) / aytExams.length).toFixed(1)) : 0
          });
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('student_targets').upsert({
        student_id: user?.id,
        university_name: formData.university,
        department_name: formData.department,
        program_type: formData.program_type,
        target_net_tyt: parseFloat(formData.target_net_tyt),
        target_net_ayt: formData.program_type === '4-yillik' ? parseFloat(formData.target_net_ayt) : null
      });
      if (error) throw error;
      toast.success("Hedeflerin başarıyla güncellendi! 🎯");
      router.refresh();
      window.location.reload();
    } catch (error: any) { toast.error("Hata: " + error.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600 h-10 w-10" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 bg-slate-50 min-h-screen text-slate-900">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full w-12 h-12 p-0 bg-slate-50 hover:bg-blue-600 hover:text-white transition-all"><ArrowLeft size={20} /></Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Üniversite Hedefim</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">TYT & AYT Performans Analizi</p>
          </div>
        </div>
        <div className="p-4 bg-orange-600 rounded-2xl text-white shadow-xl"><Trophy size={24} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* SOL: ANALİZ PANELİ */}
        <div className="lg:col-span-7 space-y-8">
          {target ? (
            <>
              {/* ANA HEDEF KARTI */}
              <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-900 p-10 text-white relative overflow-hidden group">
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-10">
                      <div>
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${target.program_type === '4-yillik' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                          {target.program_type === '4-yillik' ? '4 Yıllık / Lisans' : '2 Yıllık / Önlisans'}
                        </span>
                        <h2 className="text-4xl font-black tracking-tighter text-white mt-4">{target.university_name}</h2>
                        <p className="text-xl font-bold text-slate-400 italic">{target.department_name}</p>
                      </div>
                      <School size={48} className="text-white/10" />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* TYT DURUM */}
                      <div className="space-y-4">
                         <div className="flex justify-between items-end">
                            <p className="text-xs font-black text-blue-400 uppercase tracking-widest">TYT Performansı</p>
                            <p className="text-sm font-bold text-white">{avgs.tyt} / {target.target_net_tyt}</p>
                         </div>
                         <div className="w-full bg-white/5 h-4 rounded-full p-1">
                            <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${Math.min((avgs.tyt / target.target_net_tyt) * 100, 100)}%` }} />
                         </div>
                      </div>

                      {/* AYT DURUM (Sadece 4 yıllık ise) */}
                      {target.program_type === '4-yillik' && (
                        <div className="space-y-4">
                           <div className="flex justify-between items-end">
                              <p className="text-xs font-black text-orange-400 uppercase tracking-widest">AYT Performansı</p>
                              <p className="text-sm font-bold text-white">{avgs.ayt} / {target.target_net_ayt}</p>
                           </div>
                           <div className="w-full bg-white/5 h-4 rounded-full p-1">
                              <div className="h-full bg-orange-600 rounded-full transition-all duration-1000" style={{ width: `${Math.min((avgs.ayt / target.target_net_ayt) * 100, 100)}%` }} />
                           </div>
                        </div>
                      )}
                   </div>
                </div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />
              </Card>

              {/* DETAYLI NET ANALİZİ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">TYT Hedefe Kalan</p>
                    <div className="flex items-center gap-4">
                       <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-2xl">
                          {(target.target_net_tyt - avgs.tyt).toFixed(1)}
                       </div>
                       <p className="text-sm font-bold text-slate-600">Net daha yapmalısın.</p>
                    </div>
                 </div>
                 {target.program_type === '4-yillik' && (
                   <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">AYT Hedefe Kalan</p>
                      <div className="flex items-center gap-4">
                         <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl font-black text-2xl">
                            {(target.target_net_ayt - avgs.ayt).toFixed(1)}
                         </div>
                         <p className="text-sm font-bold text-slate-600">Net daha yapmalısın.</p>
                      </div>
                   </div>
                 )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
               <Rocket size={60} className="text-slate-100 mb-6" />
               <h3 className="text-2xl font-black text-slate-300 tracking-tight">Hemen Hayallerini Tanımla</h3>
            </div>
          )}
        </div>

        {/* SAĞ: HEDEF GİRİŞ FORMU */}
        <div className="lg:col-span-5">
           <Card className="rounded-[3rem] border-none shadow-sm bg-white p-10 sticky top-8">
              <h3 className="text-xl font-black italic mb-8 flex items-center gap-3">
                 <LayoutGrid className="text-blue-600" /> Hedef Bilgileri
              </h3>
              <form onSubmit={handleSave} className="space-y-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Program Türü</Label>
                    <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                       <button 
                        type="button" 
                        onClick={() => setFormData({...formData, program_type: '4-yillik'})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formData.program_type === '4-yillik' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                       >4 Yıllık (Lisans)</button>
                       <button 
                        type="button" 
                        onClick={() => setFormData({...formData, program_type: '2-yillik'})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formData.program_type === '2-yillik' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                       >2 Yıllık (Önlisans)</button>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Üniversite Adı</Label>
                    <Input 
                      placeholder="Örn: Ankara Üniversitesi" 
                      value={formData.university}
                      onChange={(e) => setFormData({...formData, university: e.target.value})}
                      className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold" required 
                    />
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Bölüm Adı</Label>
                    <Input 
                      placeholder="Örn: Hukuk / Mimarlık" 
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold" required 
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-2">TYT Net Hedefi</Label>
                       <Input 
                        type="number" step="0.25" placeholder="85.0" 
                        value={formData.target_net_tyt}
                        onChange={(e) => setFormData({...formData, target_net_tyt: e.target.value})}
                        className="h-14 rounded-2xl border-blue-50 bg-blue-50/30 font-black text-xl text-blue-600" required 
                       />
                    </div>
                    {formData.program_type === '4-yillik' && (
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-2">AYT Net Hedefi</Label>
                         <Input 
                          type="number" step="0.25" placeholder="65.0" 
                          value={formData.target_net_ayt}
                          onChange={(e) => setFormData({...formData, target_net_ayt: e.target.value})}
                          className="h-14 rounded-2xl border-orange-50 bg-orange-50/30 font-black text-xl text-orange-600" required={formData.program_type === '4-yillik'}
                         />
                      </div>
                    )}
                 </div>

                 <Button disabled={saving} className="w-full h-18 rounded-[2rem] bg-slate-900 text-white font-black text-lg hover:bg-blue-600 transition-all shadow-xl mt-4">
                    {saving ? <Loader2 className="animate-spin" /> : "Hedeflerimi Kilitle 🔒"}
                 </Button>
              </form>
           </Card>
        </div>
      </div>
    </div>
  );
}
