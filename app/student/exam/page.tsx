'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Trophy, Calculator, Save, ArrowLeft, Loader2, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ExamEntryPage() {
  const [student, setStudent] = useState<any>(null);
  const [examType, setExamType] = useState('TYT');
  const [examName, setExamName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<any>({});
  
  const router = useRouter();
  const supabase = createClient();

  const fetchStudentData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: sData } = await supabase.from('students').select('*').eq('id', user.id).single();
      setStudent(sData);
      
      const grade = sData?.grade_level || "";
      // Sınıfa göre dersleri başlat
      if (grade.includes("5") || grade.includes("6") || grade.includes("7") || grade.includes("8")) {
        setExamType("LGS");
        setScores({ 
            turkce: { d: 0, y: 0, n: 0 }, 
            matematik: { d: 0, y: 0, n: 0 }, 
            fen: { d: 0, y: 0, n: 0 }, 
            inkilap: { d: 0, y: 0, n: 0 }, 
            din: { d: 0, y: 0, n: 0 }, 
            ingilizce: { d: 0, y: 0, n: 0 } 
        });
      } else {
        setExamType("TYT");
        setScores({ 
            turkce: { d: 0, y: 0, n: 0 }, 
            matematik: { d: 0, y: 0, n: 0 }, 
            sosyal: { d: 0, y: 0, n: 0 }, 
            fen: { d: 0, y: 0, n: 0 } 
        });
      }
    } catch (error) { 
        console.error(error); 
    } finally { 
        setLoading(false); 
    }
  }, [supabase]);

  useEffect(() => { fetchStudentData(); }, [fetchStudentData]);

  const updateScore = (lesson: string, field: 'd' | 'y', value: string) => {
    const val = Number(value);
    setScores((prev: any) => {
      const newLessonScore = { ...prev[lesson], [field]: val };
      // Net hesapla (4 yanlış 1 doğruyu götürür)
      const calculatedNet = newLessonScore.d - (newLessonScore.y * 0.25);
      newLessonScore.n = calculatedNet < 0 ? 0 : calculatedNet;
      return { ...prev, [lesson]: newLessonScore };
    });
  };

  const totalNet = Object.values(scores).reduce((acc: number, curr: any) => acc + (curr.n || 0), 0);

  const handleSaveExam = async () => {
    if (!examName) return toast.error("Deneme adını girin.");
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // BURASI ÇOK ÖNEMLİ: Tablo adı 'exams' (çoğul) olmalı
      const { error } = await supabase.from('exams').insert([{
        student_id: user?.id,
        exam_type: examType,
        exam_name: examName,
        results_data: scores, // DB'deki sütun isminle aynı olmalı
        total_net: totalNet,
        exam_date: new Date().toISOString()
      }]);

      if (error) {
        console.error("Supabase Hatası:", error);
        throw error;
      }

      toast.success("Deneme sınavı başarıyla kaydedildi! 🚀");
      router.push('/student');
    } catch (error: any) {
      toast.error("Kaydedilemedi: " + error.message);
    } finally { 
        setIsSaving(false); 
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <Loader2 className="animate-spin text-blue-600 h-12 w-12 mb-4" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Yükleniyor...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <Button variant="outline" onClick={() => router.back()} className="rounded-2xl h-12 w-12 p-0 shadow-sm border-slate-100"><ArrowLeft size={20} /></Button>
        <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anlık Net</span>
            <div className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-2xl shadow-xl shadow-blue-100 tracking-tighter">
                {totalNet.toFixed(2)}
            </div>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[3rem] overflow-hidden bg-white">
        <CardHeader className="bg-slate-900 text-white p-10">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-1 text-center md:text-left">
                <CardTitle className="text-2xl font-black uppercase tracking-widest flex items-center justify-center md:justify-start gap-3">
                   <Trophy size={28} className="text-amber-400" /> {examType} Deneme Girişi
                </CardTitle>
                <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] italic uppercase">Analiz İçin Verileri Eksiksiz Doldurun</p>
              </div>
           </div>
        </CardHeader>
        
        <CardContent className="p-10 space-y-10">
           <div className="space-y-3">
              <Label className="font-black text-xs uppercase tracking-[0.2em] text-slate-500 ml-2">Deneme Sınavı Adı / Yayın</Label>
              <Input 
                placeholder="Örn: 3D Yayınları Türkiye Geneli" 
                className="h-16 rounded-[1.5rem] border-slate-100 bg-slate-50 font-black text-xl px-8 focus:bg-white transition-all shadow-inner"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.keys(scores).map((lesson) => (
                <div key={lesson} className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 space-y-6 hover:border-blue-200 transition-all group">
                   <div className="flex justify-between items-center">
                      <span className="font-black text-slate-900 uppercase tracking-tighter text-xl">{lesson}</span>
                      <div className="text-right">
                        <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Net</span>
                        <span className="bg-white text-blue-600 px-4 py-1.5 rounded-xl text-sm font-black shadow-sm border border-blue-50">
                            {scores[lesson].n.toFixed(2)}
                        </span>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Doğru</Label>
                         <Input 
                            type="number" 
                            className="h-14 rounded-2xl border-none bg-white font-black text-center text-2xl shadow-sm text-emerald-600"
                            value={scores[lesson].d}
                            onChange={(e) => updateScore(lesson, 'd', e.target.value)}
                         />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Yanlış</Label>
                         <Input 
                            type="number" 
                            className="h-14 rounded-2xl border-none bg-white font-black text-center text-2xl shadow-sm text-red-500"
                            value={scores[lesson].y}
                            onChange={(e) => updateScore(lesson, 'y', e.target.value)}
                         />
                      </div>
                   </div>
                </div>
              ))}
           </div>

           <Button 
             onClick={handleSaveExam}
             disabled={isSaving}
             className="w-full h-24 bg-slate-900 hover:bg-black text-white rounded-[2.5rem] font-black text-2xl shadow-2xl gap-4 transition-all active:scale-[0.98] mt-4 group"
           >
             {isSaving ? <Loader2 className="animate-spin" size={32} /> : <Target size={32} className="text-blue-400 group-hover:scale-110 transition-transform" />}
             {isSaving ? "Kaydediliyor..." : "Deneme Sınavını Tamamla"}
           </Button>
        </CardContent>
      </Card>
    </div>
  );
}
