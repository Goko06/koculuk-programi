'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, Clock, Send, Plus, Trash2, 
  Smile, Meh, Frown, Save, Loader2, 
  ArrowLeft, Sparkles, MessageSquare 
} from 'lucide-react';
import { toast } from 'sonner';

// URL Parametrelerini okumak için yardımcı bileşen
function DailyReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const pomodoroValue = searchParams.get('pomodoro');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mood, setMood] = useState('😐');
  const [totalDuration, setTotalDuration] = useState(pomodoroValue || '');
  const [generalNote, setGeneralNote] = useState('');
  
  // Ders bazlı çalışma verileri
  const [subjects, setSubjects] = useState<any[]>([
    { subject: '', solved: '', correct: '', wrong: '', duration: '', source: '' }
  ]);

  const addSubject = () => {
    setSubjects([...subjects, { subject: '', solved: '', correct: '', wrong: '', duration: '', source: '' }]);
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const updateSubject = (index: number, field: string, value: string) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = value;
    setSubjects(newSubjects);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı.");

      // 1. Önce öğrencinin koçunu bul (Bildirim için)
      const { data: studentData } = await supabase
        .from('students')
        .select('coach_id, full_name')
        .eq('id', user.id)
        .single();

      // 2. Günlük Raporu Kaydet
      const { error: entryError } = await supabase.from('daily_entries').insert({
        student_id: user.id,
        entry_date: new Date().toISOString().split('T')[0],
        mood,
        total_duration_minutes: parseInt(totalDuration),
        general_note: generalNote,
        subjects_data: subjects
      });

      if (entryError) throw entryError;

      // 3. Koça Bildirim Gönder
      if (studentData?.coach_id) {
        await supabase.from('notifications').insert({
          user_id: studentData.coach_id,
          title: "Yeni Günlük Rapor! 📝",
          message: `${studentData.full_name} bugünkü çalışma raporunu gönderdi.`,
          type: 'info'
        });
      }

      toast.success("Raporun başarıyla gönderildi! Yarın daha iyisini yapabilirsin. 🚀");
      router.push('/student');
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-10 bg-slate-50 min-h-screen text-slate-900 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full w-12 h-12 p-0 bg-slate-50">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Günlük Rapor</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">Bugünkü emeklerini kaydet.</p>
          </div>
        </div>
        
        {/* Mood Seçici */}
        <div className="flex bg-slate-100 p-2 rounded-3xl gap-2">
           {[
             { icon: Frown, val: '😞' },
             { icon: Meh, val: '😐' },
             { icon: Smile, val: '😊' }
           ].map((m) => (
             <button
              key={m.val}
              onClick={() => setMood(m.val)}
              className={`p-3 rounded-2xl transition-all ${mood === m.val ? 'bg-white shadow-md scale-110' : 'text-slate-400 hover:text-slate-600'}`}
             >
               <m.icon size={24} />
             </button>
           ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* GENEL BİLGİLER */}
        <Card className="rounded-[3rem] border-none shadow-sm bg-white p-10">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                 <Label className="font-black text-xs uppercase tracking-widest text-blue-600 ml-2 italic">Toplam Odaklanma (Dakika)</Label>
                 <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-600" size={20} />
                    <Input 
                      required type="number" placeholder="Örn: 120" 
                      value={totalDuration}
                      onChange={(e) => setTotalDuration(e.target.value)}
                      className={`h-16 pl-14 rounded-2xl border-blue-100 font-black text-xl bg-blue-50/30 focus:bg-white transition-all ${pomodoroValue ? 'ring-4 ring-blue-500/10 border-blue-500' : ''}`}
                    />
                    {pomodoroValue && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-lg">POMODORO'DAN GELDİ</span>
                    )}
                 </div>
              </div>
              <div className="space-y-3">
                 <Label className="font-black text-xs uppercase tracking-widest text-slate-400 ml-2 italic">Günün Notu</Label>
                 <Input 
                  placeholder="Bugün nasıldı? (Opsiyonel)" 
                  value={generalNote}
                  onChange={(e) => setGeneralNote(e.target.value)}
                  className="h-16 rounded-2xl border-slate-100 bg-slate-50 font-bold"
                 />
              </div>
           </div>
        </Card>

        {/* DERS BAZLI DETAYLAR */}
        <div className="space-y-6">
           <div className="flex justify-between items-center px-4">
              <h2 className="text-xl font-black italic flex items-center gap-3"><BookOpen className="text-blue-600" /> Çalışılan Dersler</h2>
              <Button type="button" onClick={addSubject} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl font-black px-6 h-10 transition-all">
                <Plus size={18} className="mr-2" /> Branş Ekle
              </Button>
           </div>

           {subjects.map((sub, index) => (
             <Card key={index} className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 relative group overflow-hidden border-l-8 border-l-blue-600">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                   <div className="md:col-span-3 space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ders Adı</Label>
                      <Input 
                        placeholder="Matematik" value={sub.subject} 
                        onChange={(e) => updateSubject(index, 'subject', e.target.value)}
                        className="rounded-xl bg-slate-50 border-none font-bold h-12" required
                      />
                   </div>
                   <div className="md:col-span-2 space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Çözülen Soru</Label>
                      <Input 
                        type="number" placeholder="80" value={sub.solved} 
                        onChange={(e) => updateSubject(index, 'solved', e.target.value)}
                        className="rounded-xl bg-slate-50 border-none font-bold h-12" required
                      />
                   </div>
                   <div className="md:col-span-2 space-y-2">
                      <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Doğru</Label>
                      <Input 
                        type="number" placeholder="D" value={sub.correct} 
                        onChange={(e) => updateSubject(index, 'correct', e.target.value)}
                        className="rounded-xl bg-emerald-50/50 border-none font-black text-emerald-700 h-12"
                      />
                   </div>
                   <div className="md:col-span-2 space-y-2">
                      <Label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Yanlış</Label>
                      <Input 
                        type="number" placeholder="Y" value={sub.wrong} 
                        onChange={(e) => updateSubject(index, 'wrong', e.target.value)}
                        className="rounded-xl bg-red-50/50 border-none font-black text-red-700 h-12"
                      />
                   </div>
                   <div className="md:col-span-2 space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Süre (Dk)</Label>
                      <Input 
                        type="number" placeholder="40" value={sub.duration} 
                        onChange={(e) => updateSubject(index, 'duration', e.target.value)}
                        className="rounded-xl bg-slate-50 border-none font-bold h-12"
                      />
                   </div>
                   <div className="md:col-span-1 flex justify-end">
                      {subjects.length > 1 && (
                        <Button type="button" onClick={() => removeSubject(index)} variant="ghost" className="text-slate-300 hover:text-red-500 rounded-xl h-12 w-12 p-0">
                          <Trash2 size={20} />
                        </Button>
                      )}
                   </div>
                </div>
                {/* Alt satır: Kaynak bilgisi */}
                <div className="mt-6">
                   <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <Input 
                        placeholder="Kullanılan kaynak (Örn: 3-4-5 Yayınları)" 
                        value={sub.source} 
                        onChange={(e) => updateSubject(index, 'source', e.target.value)}
                        className="pl-10 h-10 bg-slate-50/50 border-none rounded-lg text-xs italic font-medium"
                      />
                   </div>
                </div>
             </Card>
           ))}
        </div>

        <Button 
          disabled={submitting}
          className="w-full h-20 rounded-[2rem] bg-slate-900 text-white font-black text-xl hover:bg-blue-600 transition-all shadow-2xl shadow-slate-200 mt-6"
        >
          {submitting ? <Loader2 className="animate-spin mr-2" /> : <><Save size={24} className="mr-3" /> Raporu Koçuma Gönder</>}
        </Button>
      </form>
    </div>
  );
}

// Next.js useSearchParams() kullanımı için Suspense zorunludur
export default function DailyReportPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center font-black animate-pulse">SAYFA YÜKLENİYOR...</div>}>
      <DailyReportContent />
    </Suspense>
  );
}
