'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  School, Target, Rocket, Loader2, 
  ArrowLeft, GraduationCap, Trophy, 
  Sparkles, Zap, BarChart3, LayoutGrid // <-- Buraya eklendi
} from 'lucide-react';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function StudentTargetPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [target, setTarget] = useState<any>(null);
  const [avgs, setAvgs] = useState({ primary: 0, secondary: 0 }); // LGS için Puan, YKS için TYT/AYT
  
  const [formData, setFormData] = useState({ 
    school_name: '', // Üniversite veya Lise adı
    sub_title: '',   // Bölüm veya Yüzdelik Dilim
    program_type: 'lisans', // lisans, onlisans, lgs
    target_val_1: '', // TYT Net veya LGS Puan
    target_val_2: ''  // AYT Net (Sadece YKS 4 yıllıkta)
  });
  
  const supabase = createClient();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Öğrenci Bilgisi (Sınıf Seviyesi İçin)
      const { data: sData } = await supabase.from('students').select('*').eq('id', user.id).single();
      setStudent(sData);
      const isLGS = ["5", "6", "7", "8"].includes(sData?.grade_level);

      // 2. Hedef Bilgisi
      const { data: tData } = await supabase.from('student_targets').select('*').eq('student_id', user.id).maybeSingle();
      if (tData) {
        setTarget(tData);
        setFormData({ 
          school_name: tData.university_name || '', 
          sub_title: tData.department_name || '', 
          program_type: tData.program_type || (isLGS ? 'lgs' : '4-yillik'),
          target_val_1: tData.target_net_tyt?.toString() || '', 
          target_val_2: tData.target_net_ayt?.toString() || '' 
        });
      } else {
        // Varsayılan form tipi
        setFormData(prev => ({ ...prev, program_type: isLGS ? 'lgs' : '4-yillik' }));
      }

      // 3. Ortalama Verileri (Exams tablosundan)
      const { data: eData } = await supabase.from('exams').select('total_net, exam_type').eq('student_id', user.id);
      if (eData) {
        const primaryExams = eData.filter(e => isLGS ? e.exam_type === 'LGS' : e.exam_type === 'TYT');
        const secondaryExams = eData.filter(e => e.exam_type === 'AYT');
        setAvgs({
          primary: primaryExams.length > 0 ? Number((primaryExams.reduce((acc, curr) => acc + curr.total_net, 0) / primaryExams.length).toFixed(1)) : 0,
          secondary: secondaryExams.length > 0 ? Number((secondaryExams.reduce((acc, curr) => acc + curr.total_net, 0) / secondaryExams.length).toFixed(1)) : 0
        });
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('student_targets').upsert({
        student_id: user?.id,
        university_name: formData.school_name,
        department_name: formData.sub_title,
        program_type: formData.program_type,
        target_net_tyt: parseFloat(formData.target_val_1),
        target_net_ayt: formData.program_type === '4-yillik' ? parseFloat(formData.target_val_2) : null
      });
      if (error) throw error;
      toast.success("Hedeflerin başarıyla güncellendi! 🎯");
      fetchData(); // Veriyi tazele
    } catch (error: any) { toast.error("Hata: " + error.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white font-black text-blue-600 animate-pulse text-xs uppercase tracking-widest">Hedefler Yükleniyor...</div>;

  const isLGS = ["5", "6", "7", "8"].includes(student?.grade_level);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 bg-slate-50 min-h-screen text-slate-900 pb-32">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-6 text-left">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full w-14 h-14 p-0 bg-slate-50 hover:bg-slate-900 hover:text-white transition-all"><ArrowLeft size={24} /></Button>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">{isLGS ? 'Lise Hedefim' : 'Üniversite Hedefim'}</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-none mt-1">Gelecek Planlaması & Analiz</p>
          </div>
        </div>
        <div className="p-5 bg-blue-600 rounded-[1.5rem] text-white shadow-xl rotate-3"><Target size={28} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* SOL: MEVCUT DURUM / HEDEF KARTI */}
        <div className="lg:col-span-7 space-y-8">
          {target ? (
            <Card className="rounded-[3.5rem] border-none shadow-2xl bg-slate-900 p-12 text-white relative overflow-hidden text-left">
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-12">
                      <div>
                        <span className="px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-blue-600/30 text-blue-400 border border-blue-600/20">
                          {isLGS ? 'LGS Hedefi' : (target.program_type === '4-yillik' ? 'Lisans / 4 Yıllık' : 'Önlisans / 2 Yıllık')}
                        </span>
                        <h2 className="text-5xl font-black tracking-tighter text-white mt-6 leading-tight italic uppercase">{target.university_name}</h2>
                        <p className="text-xl font-bold text-slate-400 mt-2">{target.department_name}</p>
                      </div>
                      <School size={64} className="text-white/5 absolute -right-4 -top-4" />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* BİRİNCİL DEĞER (Puan veya TYT) */}
                      <div className="space-y-5">
                         <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{isLGS ? 'LGS Puan Durumu' : 'TYT Net Durumu'}</p>
                            <p className="text-sm font-black text-white">{avgs.primary} / {target.target_net_tyt}</p>
                         </div>
                         <div className="w-full bg-white/5 h-5 rounded-full p-1 border border-white/5">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min((avgs.primary / target.target_net_tyt) * 100, 100)}%` }} />
                         </div>
                      </div>

                      {/* İKİNCİL DEĞER (Sadece YKS 4 Yıllık) */}
                      {!isLGS && target.program_type === '4-yillik' && (
                        <div className="space-y-5">
                           <div className="flex justify-between items-end">
                              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">AYT Net Durumu</p>
                              <p className="text-sm font-black text-white">{avgs.secondary} / {target.target_net_ayt}</p>
                           </div>
                           <div className="w-full bg-white/5 h-5 rounded-full p-1 border border-white/5">
                              <div className="h-full bg-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(249,115,22,0.5)]" style={{ width: `${Math.min((avgs.secondary / target.target_net_ayt) * 100, 100)}%` }} />
                           </div>
                        </div>
                      )}
                   </div>
                </div>
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/10 blur-[120px] rounded-full" />
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
               <Rocket className="text-slate-200 mb-6" size={80} />
               <h3 className="text-xl font-black uppercase italic text-slate-400">Henüz Hedef Belirlenmedi</h3>
            </div>
          )}
        </div>

        {/* SAĞ: HEDEF DÜZENLEME FORMU */}
        <div className="lg:col-span-5">
           <Card className="rounded-[3rem] border-none shadow-sm bg-white p-10 text-left">
              <div className="flex items-center gap-3 mb-10">
                 <div className="p-3 bg-slate-900 rounded-2xl text-white"><LayoutGrid size={20} /></div>
                 <h3 className="font-black text-xl uppercase tracking-tighter italic">Hedefi Güncelle</h3>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{isLGS ? 'Hedef Lise Adı' : 'Hedef Üniversite'}</Label>
                  <Input 
                    value={formData.school_name} 
                    onChange={(e) => setFormData({...formData, school_name: e.target.value})} 
                    placeholder={isLGS ? "Örn: Ankara Atatürk Fen Lisesi" : "Örn: Boğaziçi Üniversitesi"}
                    className="rounded-2xl border-slate-100 h-14 font-bold focus:ring-blue-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{isLGS ? 'Hedef Yüzdelik Dilim' : 'Hedef Bölüm'}</Label>
                  <Input 
                    value={formData.sub_title} 
                    onChange={(e) => setFormData({...formData, sub_title: e.target.value})} 
                    placeholder={isLGS ? "Örn: %0.05" : "Örn: Bilgisayar Mühendisliği"}
                    className="rounded-2xl border-slate-100 h-14 font-bold"
                  />
                </div>

                {!isLGS && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Program Tipi</Label>
                    <select 
                      value={formData.program_type}
                      onChange={(e) => setFormData({...formData, program_type: e.target.value})}
                      className="w-full h-14 rounded-2xl border border-slate-100 bg-white px-4 font-bold text-sm"
                    >
                      <option value="4-yillik">Lisans (4 Yıllık)</option>
                      <option value="2-yillik">Önlisans (2 Yıllık)</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{isLGS ? 'Hedef Puan' : 'TYT Net Hedefi'}</Label>
                    <Input 
                      type="number"
                      value={formData.target_val_1} 
                      onChange={(e) => setFormData({...formData, target_val_1: e.target.value})} 
                      placeholder={isLGS ? "500" : "100"}
                      className="rounded-2xl border-slate-100 h-14 font-bold text-center"
                    />
                  </div>
                  {!isLGS && formData.program_type === '4-yillik' && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">AYT Net Hedefi</Label>
                      <Input 
                        type="number"
                        value={formData.target_val_2} 
                        onChange={(e) => setFormData({...formData, target_val_2: e.target.value})} 
                        placeholder="70"
                        className="rounded-2xl border-slate-100 h-14 font-bold text-center"
                      />
                    </div>
                  )}
                </div>

                <Button 
                  disabled={saving} 
                  className="w-full rounded-2xl h-16 bg-blue-600 hover:bg-slate-900 text-white font-black uppercase tracking-widest transition-all shadow-lg"
                >
                  {saving ? <Loader2 className="animate-spin mr-2" /> : <Zap className="mr-2" size={18} />}
                  Hedefi Kaydet
                </Button>
              </form>
           </Card>
        </div>
      </div>
    </div>
  );
}
