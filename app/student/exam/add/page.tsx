'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Trophy, Save, ArrowLeft, Loader2, BookOpen, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ExamEntryPage() {
  const [student, setStudent] = useState<any>(null);
  const [examType, setExamType] = useState('TYT'); // TYT, AYT veya LGS
  const [examName, setExamName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<any>({});
  
  const router = useRouter();
  const supabase = createClient();

  // Branşları Tanımla
  const getInitialScores = (type: string) => {
    if (type === "LGS") {
      return { 
        turkce: { d: 0, y: 0, n: 0 }, matematik: { d: 0, y: 0, n: 0 }, fen: { d: 0, y: 0, n: 0 }, 
        inkilap: { d: 0, y: 0, n: 0 }, din: { d: 0, y: 0, n: 0 }, ingilizce: { d: 0, y: 0, n: 0 } 
      };
    }
    if (type === "AYT") {
      return { 
        matematik: { d: 0, y: 0, n: 0 }, edebiyat: { d: 0, y: 0, n: 0 }, tarih1: { d: 0, y: 0, n: 0 }, 
        cografya1: { d: 0, y: 0, n: 0 }, fizik: { d: 0, y: 0, n: 0 }, kimya: { d: 0, y: 0, n: 0 }, biyoloji: { d: 0, y: 0, n: 0 }
      };
    }
    // Varsayılan TYT
    return { 
      turkce: { d: 0, y: 0, n: 0 }, matematik: { d: 0, y: 0, n: 0 }, sosyal: { d: 0, y: 0, n: 0 }, fen: { d: 0, y: 0, n: 0 } 
    };
  };

  const fetchStudentData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: sData } = await supabase.from('students').select('*').eq('id', user.id).single();
      setStudent(sData);
      
      const grade = sData?.grade_level || "";
      if (grade.includes("5") || grade.includes("6") || grade.includes("7") || grade.includes("8")) {
        setExamType("LGS");
        setScores(getInitialScores("LGS"));
      } else {
        setExamType("TYT");
        setScores(getInitialScores("TYT"));
      }
    } catch (error) { 
        console.error(error); 
    } finally { 
        setLoading(false); 
    }
  }, [supabase]);

  useEffect(() => { fetchStudentData(); }, [fetchStudentData]);

  // Sınav Türü Değiştiğinde Branşları Güncelle
  const handleTypeChange = (type: string) => {
    setExamType(type);
    setScores(getInitialScores(type));
  };

  const updateScore = (lesson: string, field: 'd' | 'y', value: string) => {
    const val = Number(value);
    setScores((prev: any) => {
      const newLessonScore = { ...prev[lesson], [field]: val };
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
      
      const { error } = await supabase.from('exams').insert([{
        student_id: user?.id,
        exam_type: examType,
        exam_name: examName,
        results_data: scores,
        total_net: totalNet,
        exam_date: new Date().toISOString()
      }]);

      if (error) throw error;

      toast.success(`${examType} Denemesi başarıyla kaydedildi! 🚀`);
      router.push('/student/exam');
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
      {/* ÜST PANEL */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()} className="rounded-2xl h-12 w-12 p-0 border-slate-100"><ArrowLeft size={20} /></Button>
          <h1 className="text-xl font-black italic tracking-tight uppercase">Sınav Girişi</h1>
        </div>
        
        {/* SINAV TÜRÜ SEÇİCİ (Tab Yapısı) */}
        {examType !== "LGS" && (
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
            <button 
              onClick={() => handleTypeChange("TYT")}
              className={`px-8 py-2 rounded-xl text-xs font-black transition-all ${examType === "TYT" ? "bg-white text-blue-600 shadow-md scale-105" : "text-slate-400 hover:text-slate-600"}`}
            >TYT</button>
            <button 
              onClick={() => handleTypeChange("AYT")}
              className={`px-8 py-2 rounded-xl text-xs font-black transition-all ${examType === "AYT" ? "bg-white text-orange-600 shadow-md scale-105" : "text-slate-400 hover:text-slate-600"}`}
            >AYT</button>
          </div>
        )}

        <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net</span>
            <div className={`text-white px-8 py-3 rounded-2xl font-black text-2xl shadow-xl tracking-tighter transition-colors ${examType === "AYT" ? "bg-orange-600 shadow-orange-100" : "bg-blue-600 shadow-blue-100"}`}>
                {totalNet.toFixed(2)}
            </div>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[3rem] overflow-hidden bg-white">
        <CardHeader className={`${examType === "AYT" ? "bg-orange-600" : "bg-slate-900"} text-white p-10 transition-colors duration-500`}>
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-1 text-center md:text-left">
                <CardTitle className="text-2xl font-black uppercase tracking-widest flex items-center justify-center md:justify-start gap-3">
                   <Trophy size={28} className="text-amber-400" /> {examType} Deneme Girişi
                </CardTitle>
                <p className="text-white/50 text-[10px] font-black tracking-[0.3em] uppercase italic">Branş Bazlı Netlerinizi Girin</p>
              </div>
           </div>
        </CardHeader>
        
        <CardContent className="p-10 space-y-10">
           <div className="space-y-3">
              <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 italic">Deneme Sınavı Adı / Yayın</Label>
              <Input 
                placeholder="Örn: 3D Yayınları Türkiye Geneli" 
                className="h-16 rounded-[1.8rem] border-slate-100 bg-slate-50 font-black text-xl px-8 focus:bg-white transition-all shadow-inner"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(scores).map((lesson) => (
                <div key={lesson} className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 space-y-4 hover:border-blue-200 transition-all group">
                   <div className="flex justify-between items-center">
                      <span className="font-black text-slate-800 uppercase tracking-tighter text-sm italic">{lesson}</span>
                      <div className="bg-white px-3 py-1 rounded-lg border border-slate-100">
                        <span className="text-[14px] font-black text-blue-600">{scores[lesson].n.toFixed(2)}</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <Label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1">Doğru</Label>
                         <Input 
                            type="number" 
                            className="h-12 rounded-xl border-none bg-white font-black text-center text-xl text-emerald-600 shadow-sm"
                            value={scores[lesson].d}
                            onChange={(e) => updateScore(lesson, 'd', e.target.value)}
                         />
                      </div>
                      <div className="space-y-1">
                         <Label className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-1">Yanlış</Label>
                         <Input 
                            type="number" 
                            className="h-14 rounded-xl border-none bg-white font-black text-center text-xl text-red-500 shadow-sm"
                            value={scores[lesson].y}
                            onChange={(e) => updateScore(lesson, 'y', e.target.value)}
                         />
                      </div>
                   </div>
                </div>
              ))}
           </div>

           <Button 
              disabled={isSaving}
              onClick={handleSaveExam}
              className={`w-full h-18 rounded-[2rem] font-black text-white text-xl shadow-2xl transition-all active:scale-95 mt-6 ${examType === "AYT" ? "bg-orange-600 hover:bg-orange-700 shadow-orange-100" : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"}`}
           >
              {isSaving ? <Loader2 className="animate-spin mr-2" /> : <><Save size={24} className="mr-3" /> Denemeyi Kaydet</>}
           </Button>
        </CardContent>
      </Card>
    </div>
  );
}
