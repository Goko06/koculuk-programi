'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, AlertCircle, Loader2, Sparkles, Calculator } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// --- MEB UYUMLU LGS AYARLARI ---
const LGS_CONFIG: any = {
  tr: { label: 'Türkçe', max: 20, coeff: 4 },
  mat: { label: 'Matematik', max: 20, coeff: 4 },
  fen: { label: 'Fen Bilimleri', max: 20, coeff: 4 },
  ink: { label: 'İnkılap Tarihi', max: 10, coeff: 1 },
  din: { label: 'Din Kültürü', max: 10, coeff: 1 },
  ing: { label: 'İngilizce', max: 10, coeff: 1 }
};

// --- YKS DERS AYARLARI ---
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
  const [profile, setProfile] = useState<any>(null);
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
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
        // Sınıf seviyesine göre otomatik sınav türü belirleme
        if (["5", "6", "7", "8"].includes(data?.class_level?.toString())) {
          setExamType('LGS');
        }
      }
      setLoading(false);
    };
    getProfile();
  }, [supabase]);

  const calculation = useMemo(() => {
    const calcNet = (d: any, y: any, divisor: number) => {
      const dogru = Math.max(0, parseInt(d) || 0);
      const yanlis = Math.max(0, parseInt(y) || 0);
      return Math.max(0, dogru - (yanlis / divisor));
    };

    if (examType === 'LGS') {
      let weightedNetSum = 0;
      let hasError = false;
      Object.keys(LGS_CONFIG).forEach(key => {
        const d = parseInt(formData[`${key}_d`]) || 0;
        const y = parseInt(formData[`${key}_y`]) || 0;
        if (d + y > LGS_CONFIG[key].max) hasError = true;
        weightedNetSum += calcNet(d, y, 3) * LGS_CONFIG[key].coeff;
      });
      // Standart LGS puan formülü (Taban puan + Ağırlıklı Netler)
      let score = 194.7 + (weightedNetSum * 1.13);
      return { value: Number(score.toFixed(2)), error: hasError };
    } else if (examType === 'TYT') {
      const tytNet = calcNet(formData.tr_d, formData.tr_y, 4) + calcNet(formData.mat_d, formData.mat_y, 4) +
                     calcNet(formData.fen_d, formData.fen_y, 4) + calcNet(formData.sos_d, formData.sos_y, 4);
      return { value: Number(tytNet.toFixed(2)), error: false };
    } else {
      const aytNet = calcNet(formData.mat_ayt_d, formData.mat_ayt_y, 4) + calcNet(formData.edeb_ayt_d, formData.edeb_ayt_y, 4) +
                     calcNet(formData.fen_ayt_d, formData.fen_ayt_y, 4) + calcNet(formData.sos2_ayt_d, formData.sos2_ayt_y, 4);
      return { value: Number(aytNet.toFixed(2)), error: false };
    }
  }, [formData, examType]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculation.error) return toast.error("Soru sayıları limitleri aşıyor!");
    if (!formData.exam_name) return toast.error("Deneme adı giriniz!");

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
      toast.success(`${examType} denemesi başarıyla kaydedildi!`);
      router.push('/student/exam');
    } catch (error: any) { 
      toast.error(error.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const isLGSStudent = ["5", "6", "7", "8"].includes(profile?.class_level?.toString());
  const currentDersler = examType === 'LGS' 
    ? Object.keys(LGS_CONFIG).map(k => ({ k, l: LGS_CONFIG[k].label, m: LGS_CONFIG[k].max })) 
    : examType === 'TYT' ? TYT_DERSLER : AYT_DERSLER;

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white italic font-black text-blue-600 animate-pulse uppercase tracking-[0.3em]">
      Yükleniyor...
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 pb-32">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-6">
          <Button 
            onClick={() => router.back()} 
            variant="ghost" 
            className="rounded-full w-14 h-14 p-0 bg-slate-50 hover:bg-slate-900 hover:text-white transition-all"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">{examType} Denemesi Ekle</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1 italic">Branş Bazlı Net Girişi</p>
          </div>
        </div>

        {/* TYT/AYT Geçiş Butonları (Sadece Lise Grubu İçin) */}
        {!isLGSStudent && (
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            {['TYT', 'AYT'].map((t) => (
              <button 
                key={t} 
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
        
        {/* Giriş Alanı */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-[3rem] border-none shadow-sm bg-white p-8 space-y-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Deneme Bilgisi</Label>
              <Input 
                required 
                placeholder="Deneme Sınavı Adı (Örn: Özdebir TYT-1)" 
                value={formData.exam_name} 
                onChange={e => setFormData({...formData, exam_name: e.target.value})} 
                className="rounded-2xl border-slate-100 h-14 font-bold text-lg focus:ring-blue-500" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentDersler.map((ders: any) => (
                <div key={ders.k} className="p-6 rounded-[2rem] border-2 border-slate-50 flex flex-col gap-4 bg-slate-50 hover:bg-white hover:border-blue-100 transition-all group">
                  <span className="font-black text-[10px] uppercase text-slate-400 group-hover:text-blue-500">{ders.l} <span className="opacity-50">(Max: {ders.m})</span></span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Input 
                        type="number" 
                        placeholder="D" 
                        value={formData[`${ders.k}_d`]} 
                        onChange={e => setFormData({...formData, [`${ders.k}_d`]: e.target.value})} 
                        className="rounded-xl h-12 text-center font-black text-blue-600 border-none shadow-inner" 
                      />
                    </div>
                    <div className="space-y-1">
                      <Input 
                        type="number" 
                        placeholder="Y" 
                        value={formData[`${ders.k}_y`]} 
                        onChange={e => setFormData({...formData, [`${ders.k}_y`]: e.target.value})} 
                        className="rounded-xl h-12 text-center font-black text-red-500 border-none shadow-inner" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Özet ve Kaydet */}
        <div className="lg:col-span-4">
          <Card className="rounded-[3.5rem] border-none shadow-2xl bg-slate-900 p-10 text-white sticky top-8 text-center border-b-[6px] border-blue-600">
            <div className="p-4 bg-white/5 rounded-full w-fit mx-auto mb-6">
               <Sparkles className="text-blue-400" size={32} />
            </div>
            <p className="text-[10px] font-black uppercase text-blue-400 mb-2 tracking-widest">{examType === 'LGS' ? 'Tahmini Puan' : 'Hesaplanan Net'}</p>
            <h2 className="text-7xl font-black italic tracking-tighter tabular-nums">{calculation.value}</h2>
            
            <div className="pt-10 border-t border-white/10 mt-10 space-y-4">
              <Button 
                disabled={saving} 
                type="submit"
                className="w-full h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 transition-all active:scale-95"
              >
                {saving ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2"><Save size={18} /> Kaydı Tamamla</span>}
              </Button>
              <p className="text-[9px] text-slate-500 font-bold italic">Netler otomatik olarak 3 yanlış 1 doğruyu (LGS) veya 4 yanlış 1 doğruyu (YKS) götürecek şekilde hesaplanır.</p>
            </div>
          </Card>
        </div>

      </form>
    </div>
  );
}
