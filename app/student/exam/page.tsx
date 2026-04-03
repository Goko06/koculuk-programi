'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Sparkles, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// --- YAPILANDIRMALAR ---
const LGS_CONFIG: any = {
  tr: { label: 'Türkçe', max: 20, coeff: 4 },
  mat: { label: 'Matematik', max: 20, coeff: 4 },
  fen: { label: 'Fen Bilimleri', max: 20, coeff: 4 },
  ink: { label: 'İnkılap Tarihi', max: 10, coeff: 1 },
  din: { label: 'Din Kültürü', max: 10, coeff: 1 },
  ing: { label: 'İngilizce', max: 10, coeff: 1 }
};

const TYT_DERSLER = [
  { k: 'tr', l: 'Türkçe', m: 40 },
  { k: 'mat', l: 'Temel Matematik', m: 40 },
  { k: 'fen', l: 'Fen Bilimleri', m: 20 },
  { k: 'sos', l: 'Sosyal Bilimler', m: 20 }
];

const AYT_DERSLER = [
  { k: 'mat_ayt', l: 'AYT Matematik', m: 40 },
  { k: 'edeb_ayt', l: 'Ed.-Sos-1', m: 40 },
  { k: 'fen_ayt', l: 'Fen Bilimleri-2', m: 40 },
  { k: 'sos2_ayt', l: 'Sosyal Bilimler-2', m: 40 }
];

export default function AddExamPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [examType, setExamType] = useState<'LGS' | 'TYT' | 'AYT'>('TYT');
  
  const [formData, setFormData] = useState<any>({
    exam_name: '',
    tr_d: '', tr_y: '', mat_d: '', mat_y: '', fen_d: '', fen_y: '', sos_d: '', sos_y: '',
    mat_ayt_d: '', mat_ayt_y: '', edeb_ayt_d: '', edeb_ayt_y: '', fen_ayt_d: '', fen_ayt_y: '', sos2_ayt_d: '', sos2_ayt_y: '',
    ink_d: '', ink_y: '', din_d: '', din_y: '', ing_d: '', ing_y: '',
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getStudent = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('students').select('*').eq('id', user.id).single();
        setStudent(data);
        // ÖNEMLİ: Öğrenci LGS grubundaysa tipi LGS yap, değilse TYT yap
        if (["5", "6", "7", "8"].includes(data?.grade_level)) {
          setExamType('LGS');
        } else {
          setExamType('TYT');
        }
      }
      setLoading(false);
    };
    getStudent();
  }, [supabase]);

  const isLGSStudent = ["5", "6", "7", "8"].includes(student?.grade_level);

  const calculation = useMemo(() => {
    const calcNet = (d: any, y: any, divisor: number) => {
      const dogru = Math.max(0, parseInt(d) || 0);
      const yanlis = Math.max(0, parseInt(y) || 0);
      return Math.max(0, dogru - (yanlis / divisor));
    };

    if (examType === 'LGS') {
      let weightedNetSum = 0;
      Object.keys(LGS_CONFIG).forEach(key => {
        const d = formData[`${key}_d`] || 0;
        const y = formData[`${key}_y`] || 0;
        weightedNetSum += calcNet(d, y, 3) * LGS_CONFIG[key].coeff;
      });
      // MEB LGS Puan Formülü Yaklaşık
      let score = 194.7 + (weightedNetSum * 1.13);
      return { value: Number(score.toFixed(2)) };
    } else {
      const currentFields = examType === 'TYT' ? TYT_DERSLER : AYT_DERSLER;
      const totalNet = currentFields.reduce((acc, ders) => acc + calcNet(formData[`${ders.k}_d`], formData[`${ders.k}_y`], 4), 0);
      return { value: Number(totalNet.toFixed(2)) };
    }
  }, [formData, examType]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.exam_name) return toast.error("Deneme adı zorunludur!");
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('exams').insert([{
        student_id: user?.id,
        exam_name: formData.exam_name,
        exam_type: examType,
        total_net: calculation.value,
        exam_date: new Date().toISOString()
      }]);
      if (error) throw error;
      toast.success(`${examType} kaydedildi!`);
      router.push('/student/exam');
    } catch (error: any) { 
      toast.error(error.message); 
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse uppercase tracking-widest text-xs">Profil Yükleniyor...</div>;

  const currentDersler = examType === 'LGS' ? Object.keys(LGS_CONFIG).map(k => ({k, l: LGS_CONFIG[k].label, m: LGS_CONFIG[k].max})) : examType === 'TYT' ? TYT_DERSLER : AYT_DERSLER;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 pb-32">
      
      {/* ÜST PANEL */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-6">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full w-14 h-14 p-0 bg-slate-50 hover:bg-slate-900 hover:text-white transition-all">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">{examType} Sınavı Ekle</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1 italic">Branş Bazlı Veri Girişi</p>
          </div>
        </div>

        {/* EĞER YKS ÖĞRENCİSİYSE TYT/AYT GEÇİŞİ GÖSTER, LGS İSE GİZLE */}
        {!isLGSStudent && (
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            {['TYT', 'AYT'].map((t) => (
              <button 
                key={t} 
                type="button"
                onClick={() => setExamType(t as any)} 
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${examType === t ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-[3rem] border-none shadow-sm bg-white p-8 space-y-8">
            <Input 
              required 
              placeholder="Deneme Kurumu / Adı" 
              value={formData.exam_name} 
              onChange={e => setFormData({...formData, exam_name: e.target.value})} 
              className="rounded-2xl border-slate-100 h-14 font-bold text-lg focus:ring-blue-600" 
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentDersler.map((ders: any) => (
                <div key={ders.k} className="p-6 rounded-[2rem] bg-slate-50 border border-transparent hover:border-blue-100 transition-all group">
                  <span className="font-black text-[10px] uppercase text-slate-400 group-hover:text-blue-600 transition-colors">
                    {ders.l} <span className="opacity-50">(Maks: {ders.m})</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="space-y-1">
                       <Input type="number" placeholder="D" value={formData[`${ders.k}_d`]} onChange={e => setFormData({...formData, [`${ders.k}_d`]: e.target.value})} className="rounded-xl h-12 text-center font-bold" />
                    </div>
                    <div className="space-y-1">
                       <Input type="number" placeholder="Y" value={formData[`${ders.k}_y`]} onChange={e => setFormData({...formData, [`${ders.k}_y`]: e.target.value})} className="rounded-xl h-12 text-center font-bold text-red-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* SAĞ ÖZET PANELİ */}
        <div className="lg:col-span-4">
          <Card className="rounded-[3.5rem] border-none shadow-2xl bg-slate-900 p-10 text-white sticky top-8 text-center overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={100} /></div>
             <p className="text-[10px] font-black uppercase text-blue-400 mb-2 tracking-[0.2em]">Tahmini {examType === 'LGS' ? 'Puan' : 'Net'}</p>
             <h2 className="text-6xl font-black italic tracking-tighter mb-8">{calculation.value}</h2>
             
             <Button 
                type="submit" 
                disabled={saving}
                className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest transition-all"
             >
                {saving ? <Loader2 className="animate-spin" /> : <><Save className="mr-2" size={20} /> Kaydet</>}
             </Button>
          </Card>
        </div>
      </form>
    </div>
  );
}
