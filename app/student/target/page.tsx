'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Target, 
  GraduationCap, 
  School, 
  ChevronLeft, 
  Save, 
  Sparkles,
  Trophy
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function TargetPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [target, setTarget] = useState({
    university_name: '',
    department_name: '',
    target_net_tyt: '',
    target_net_ayt: ''
  });

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: pData } = await supabase
          .from('profiles')
          .select('class_level')
          .eq('id', user.id)
          .single();
        setProfile(pData);

        const { data: tData } = await supabase
          .from('student_targets')
          .select('*')
          .eq('student_id', user.id)
          .maybeSingle();

        if (tData) {
          setTarget({
            university_name: tData.university_name || '',
            department_name: tData.department_name || '',
            target_net_tyt: tData.target_net_tyt?.toString() || '',
            target_net_ayt: tData.target_net_ayt?.toString() || ''
          });
        }
      } catch (error) {
        console.error('Veri çekme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, router]);

  const handleSave = async () => {
    if (!target.university_name || !target.department_name) {
      toast.error('Lütfen kurum ve hedef alanlarını doldurun.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const classLevel = profile?.class_level?.toString() || "";
      const isLGS = ["5", "6", "7", "8"].includes(classLevel);

      // SQL Şemasına Tam Uyum: 'updated_at' kaldırıldı, 'program_type' eklendi.
      const targetData = {
        student_id: user.id,
        university_name: target.university_name,
        department_name: target.department_name,
        program_type: isLGS ? 'LGS' : 'YKS',
        target_net_tyt: parseFloat(target.target_net_tyt) || 0,
        target_net_ayt: isLGS ? 0 : (parseFloat(target.target_net_ayt) || 0)
      };

      const { error } = await supabase
        .from('student_targets')
        .upsert(targetData, { onConflict: 'student_id' });

      if (error) throw error;
      
      toast.success('Hedeflerin başarıyla güncellendi!');
    } catch (error: any) {
      console.error('Kaydetme hatası:', error);
      toast.error(`Hata: ${error.message || 'Alanları kontrol edin.'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white italic font-black text-blue-600 animate-pulse uppercase tracking-[0.3em]">
      YÜKLENİYOR...
    </div>
  );

  const classLevel = profile?.class_level?.toString() || "";
  const isLGS = ["5", "6", "7", "8"].includes(classLevel);
  const TargetIcon = isLGS ? School : GraduationCap;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 bg-[#FDFDFD] min-h-screen pb-24 text-slate-900">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-blue-600"
        >
          <ChevronLeft size={18} className="mr-1" /> Geri Dön
        </Button>
        <div className="px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-2">
          <Trophy size={16} className="text-blue-600" />
          <span className="text-[10px] font-black uppercase tracking-widest italic text-slate-600">Hedef Ayarları</span>
        </div>
      </div>

      <div className="text-center space-y-4">
        <div className={`w-24 h-24 mx-auto rounded-[2.8rem] flex items-center justify-center shadow-2xl transition-transform hover:scale-105 duration-500 ${isLGS ? 'bg-emerald-600 shadow-emerald-100' : 'bg-blue-600 shadow-blue-100'}`}>
          <TargetIcon size={48} className="text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-slate-900">
            {isLGS ? 'Hedeflediğin Lise' : 'Hedeflediğin Üniversite'}
          </h1>
          <p className="text-slate-400 font-bold italic mt-2 uppercase text-[11px] tracking-widest opacity-60">Geleceğini Şekillendir</p>
        </div>
      </div>

      <Card className="rounded-[4rem] border-none shadow-2xl p-10 md:p-16 bg-white relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
          <div className="space-y-8">
            <div className="space-y-3">
              <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic flex items-center gap-2">
                <Target size={14} className="text-blue-500" /> 
                {isLGS ? 'LİSE ADI' : 'ÜNİVERSİTE ADI'}
              </Label>
              <Input 
                value={target.university_name}
                onChange={(e) => setTarget({...target, university_name: e.target.value})}
                placeholder={isLGS ? "Örn: Kabataş Erkek" : "Örn: ODTÜ"}
                className="h-16 rounded-[1.5rem] border-slate-100 bg-slate-50 font-bold focus:ring-2 focus:ring-blue-600 shadow-inner text-slate-800"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic flex items-center gap-2">
                <Sparkles size={14} className="text-orange-500" />
                {isLGS ? 'HEDEF PUAN / YÜZDELİK' : 'HEDEF BÖLÜM'}
              </Label>
              <Input 
                value={target.department_name}
                onChange={(e) => setTarget({...target, department_name: e.target.value})}
                placeholder={isLGS ? "Örn: 490 Puan" : "Örn: Tıp Fakültesi"}
                className="h-16 rounded-[1.5rem] border-slate-100 bg-slate-50 font-bold focus:ring-2 focus:ring-blue-600 shadow-inner text-slate-800"
              />
            </div>
          </div>
          <div className="space-y-8">
            <div className="space-y-3">
              <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic flex items-center gap-2">
                <TargetIcon size={14} className="text-emerald-500" />
                {isLGS ? 'TOPLAM NET HEDEFİ' : 'TYT NET HEDEFİ'}
              </Label>
              <Input 
                type="number"
                value={target.target_net_tyt}
                onChange={(e) => setTarget({...target, target_net_tyt: e.target.value})}
                placeholder={isLGS ? "90 soru üzerinden" : "120 soru üzerinden"}
                className="h-16 rounded-[1.5rem] border-slate-100 bg-slate-50 font-bold focus:ring-2 focus:ring-blue-600 shadow-inner text-slate-800"
              />
            </div>
            {!isLGS && (
              <div className="space-y-3">
                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic flex items-center gap-2">
                  <GraduationCap size={14} className="text-purple-500" />
                  AYT NET HEDEFİ
                </Label>
                <Input 
                  type="number"
                  value={target.target_net_ayt}
                  onChange={(e) => setTarget({...target, target_net_ayt: e.target.value})}
                  placeholder="80 soru üzerinden"
                  className="h-16 rounded-[1.5rem] border-slate-100 bg-slate-50 font-bold focus:ring-2 focus:ring-blue-600 shadow-inner text-slate-800"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 flex justify-center">
          <Button 
            disabled={saving}
            onClick={handleSave}
            className={`h-20 px-16 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 border-none text-white italic ${isLGS ? 'bg-emerald-600 shadow-emerald-200' : 'bg-blue-600 shadow-blue-200'}`}
          >
            {saving ? 'İŞLENİYOR...' : (
              <span className="flex items-center gap-3">
                <Save size={20} /> Hedefimi Kaydet
              </span>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
