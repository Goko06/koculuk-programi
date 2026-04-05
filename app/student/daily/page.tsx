'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BookOpen, Clock, Send, Plus, Trash2,
  Smile, Meh, Frown, Save, Loader2,
  ArrowLeft, Sparkles, MessageSquare, Book, User, FileText
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

// --- MÜFREDAT HAVUZU (Sadece ders isimleri) ---
const SUBJECTS_BY_LEVEL: any = {
  "5": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din Kültürü"],
  "6": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din Kültürü"],
  "7": ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din Kültürü"],
  "8": ["Türkçe", "Matematik", "Fen Bilimleri", "İnkılap Tarihi", "İngilizce", "Din Kültürü"],
  "9": ["Edebiyat", "Matematik", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya"],
  "10": ["Edebiyat", "Matematik", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya"],
  "11": ["Edebiyat", "Matematik", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya"],
  "12": ["Türkçe (TYT)", "Matematik (TYT)", "Geometri (TYT)", "Fizik (TYT/AYT)", "Kimya (TYT/AYT)", "Biyoloji (TYT/AYT)", "Matematik (AYT)", "Edebiyat (AYT)", "Tarih", "Coğrafya", "Felsefe", "Din Kültürü"],
  "mezun": ["Türkçe (TYT)", "Matematik (TYT)", "Geometri (TYT)", "Fizik (TYT/AYT)", "Kimya (TYT/AYT)", "Biyoloji (TYT/AYT)", "Matematik (AYT)", "Edebiyat (AYT)", "Tarih", "Coğrafya", "Felsefe", "Din Kültürü"]
};

function DailyReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const pomodoroValue = searchParams.get('pomodoro');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentLevel, setStudentLevel] = useState('12');
  
  // Form States
  const [mood, setMood] = useState('😐');
  const [totalDuration, setTotalDuration] = useState(pomodoroValue || '');
  const [generalNote, setGeneralNote] = useState('');
  const [subjects, setSubjects] = useState<any[]>([
    { subject: '', solved: '', correct: '', wrong: '', duration: '', source: '' }
  ]);
  
  // Kitap Okuma State
  const [bookData, setBookData] = useState({ name: '', author: '', pages: '' });

  useEffect(() => {
    async function getStudentInfo() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('class_level').eq('id', user.id).single();
        if (profile) setStudentLevel(profile.class_level);
      }
      setLoading(false);
    }
    getStudentInfo();
  }, [supabase]);

  const addSubject = () => setSubjects([...subjects, { subject: '', solved: '', correct: '', wrong: '', duration: '', source: '' }]);
  const removeSubject = (index: number) => setSubjects(subjects.filter((_, i) => i !== index));
  const updateSubject = (index: number, field: string, value: string) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = value;
    setSubjects(newSubjects);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalDuration) return toast.error("Lütfen çalışma süresini girin.");
    
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı.");

      // Profil bilgilerini al (Coach_id ve isim için)
      const { data: profile } = await supabase
        .from('profiles')
        .select('coach_id, full_name')
        .eq('id', user.id)
        .single();

      // Raporu Kaydet
      const { error: entryError } = await supabase.from('daily_entries').insert([{
        student_id: user.id, // Auth ID ile Profile ID aynı olduğu için direkt user.id
        entry_date: new Date().toISOString().split('T')[0], // Sadece YYYY-MM-DD formatı
        mood: mood,
        total_duration_minutes: parseInt(totalDuration) || 0,
        general_note: generalNote,
        subjects_data: { 
          studies: subjects, 
          book: bookData 
        }
      }]);

      if (entryError) {
        console.error("DB Insert Error:", entryError);
        throw entryError;
      }

      // Koça bildirim gönder
      if (profile?.coach_id) {
        await supabase.from('notifications').insert([{
          user_id: profile.coach_id,
          title: "Yeni Çalışma Raporu! 📝",
          message: `${profile.full_name} günlük raporunu gönderdi.`,
          type: 'info',
          is_read: false
        }]);
      }

      toast.success("Raporun başarıyla gönderildi! 🚀");
      router.push('/student');
      
    } catch (error: any) {
      console.error("Submit Error:", error);
      toast.error("Rapor gönderilemedi: " + (error.message || "Veritabanı hatası"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-black animate-pulse uppercase italic tracking-[0.3em] text-blue-600">Profil Verileri Alınıyor...</div>;

  const availableLessons = SUBJECTS_BY_LEVEL[studentLevel] || SUBJECTS_BY_LEVEL["12"];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-10 bg-slate-50 min-h-screen text-slate-900 pb-32">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-6">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full w-14 h-14 bg-slate-50 hover:bg-slate-900 hover:text-white transition-all"><ArrowLeft size={24} /></Button>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Günlük Rapor</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest italic mt-2 opacity-70">Bugünkü emeklerini sisteme işle.</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-2 rounded-[1.5rem] gap-2">
          {[{ icon: Frown, val: '😞' }, { icon: Meh, val: '😐' }, { icon: Smile, val: '😊' }].map((m) => (
            <button key={m.val} onClick={() => setMood(m.val)} className={`p-4 rounded-xl transition-all ${mood === m.val ? 'bg-white shadow-lg scale-110' : 'text-slate-400 hover:text-slate-600'}`}><m.icon size={24} /></button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* GENEL BİLGİLER */}
        <Card className="rounded-[3rem] border-none shadow-sm bg-white p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-600 ml-2 italic">Toplam Çalışma (Dakika)</Label>
              <div className="relative group">
                <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-600 group-focus-within:scale-110 transition-transform" size={22} />
                <Input required type="number" placeholder="Örn: 240" value={totalDuration} onChange={(e) => setTotalDuration(e.target.value)} className="h-16 pl-14 rounded-2xl border-none bg-blue-50/40 font-black text-2xl focus:ring-4 ring-blue-500/10 transition-all" />
                {pomodoroValue && <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg tracking-widest uppercase italic">POMODORO VERİSİ</span>}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 italic">Günün Özeti / Notu</Label>
              <div className="relative group">
                 <MessageSquare className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                 <Input placeholder="Bugün nasıl geçti?" value={generalNote} onChange={(e) => setGeneralNote(e.target.value)} className="h-16 pl-14 rounded-2xl border-none bg-slate-50 font-bold" />
              </div>
            </div>
          </div>
        </Card>

        {/* KİTAP OKUMA BÖLÜMÜ (Yeni Eklendi) */}
        <div className="space-y-6">
          <h2 className="text-xl font-black italic flex items-center gap-3 px-4 uppercase tracking-tighter"><Book className="text-orange-500" /> Kitap Okuma Takibi</h2>
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 border-l-8 border-l-orange-500 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12"><Book size={80} /></div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="space-y-2">
                   <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kitap Adı</Label>
                   <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <Input placeholder="Örn: Nutuk" value={bookData.name} onChange={e => setBookData({...bookData, name: e.target.value})} className="h-12 pl-11 rounded-xl bg-slate-50 border-none font-bold" />
                   </div>
                </div>
                <div className="space-y-2">
                   <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Yazar</Label>
                   <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <Input placeholder="Örn: M. Kemal Atatürk" value={bookData.author} onChange={e => setBookData({...bookData, author: e.target.value})} className="h-12 pl-11 rounded-xl bg-slate-50 border-none font-bold" />
                   </div>
                </div>
                <div className="space-y-2">
                   <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Okunan Sayfa</Label>
                   <div className="relative">
                      <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={16} />
                      <Input type="number" placeholder="Örn: 45" value={bookData.pages} onChange={e => setBookData({...bookData, pages: e.target.value})} className="h-12 pl-11 rounded-xl bg-orange-50/50 border-none font-black text-orange-700" />
                   </div>
                </div>
             </div>
          </Card>
        </div>

        {/* DERS BAZLI DETAYLAR */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-4">
            <h2 className="text-xl font-black italic flex items-center gap-3 uppercase tracking-tighter"><BookOpen className="text-blue-600" /> Çalışılan Dersler</h2>
            <Button type="button" onClick={addSubject} className="bg-blue-600 hover:bg-slate-900 text-white rounded-xl font-black px-6 h-12 shadow-lg shadow-blue-100 transition-all uppercase tracking-widest text-[10px]"><Plus size={18} className="mr-2" /> Yeni Ders Ekle</Button>
          </div>
          {subjects.map((sub, index) => (
            <Card key={index} className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 relative group overflow-hidden border-l-8 border-l-blue-600">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                <div className="md:col-span-3 space-y-2">
                  <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Ders</Label>
                  <Select onValueChange={(v) => updateSubject(index, 'subject', v)} value={sub.subject}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-black">
                      <SelectValue placeholder="Ders Seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-xl shadow-2xl border-slate-100">
                      {availableLessons.map((lesson: string) => <SelectItem key={lesson} value={lesson} className="font-bold py-3">{lesson}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Soru</Label>
                  <Input type="number" placeholder="Adet" value={sub.solved} onChange={(e) => updateSubject(index, 'solved', e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-black" required />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1">Doğru</Label>
                  <Input type="number" placeholder="D" value={sub.correct} onChange={(e) => updateSubject(index, 'correct', e.target.value)} className="h-12 rounded-xl bg-emerald-50/50 border-none font-black text-emerald-700" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-1">Yanlış</Label>
                  <Input type="number" placeholder="Y" value={sub.wrong} onChange={(e) => updateSubject(index, 'wrong', e.target.value)} className="h-12 rounded-xl bg-red-50/50 border-none font-black text-red-700" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Süre (Dk)</Label>
                  <Input type="number" placeholder="Dk" value={sub.duration} onChange={(e) => updateSubject(index, 'duration', e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  {subjects.length > 1 && <Button type="button" onClick={() => removeSubject(index)} variant="ghost" className="text-slate-300 hover:text-red-500 rounded-xl h-12 w-12 p-0 transition-colors"><Trash2 size={20} /></Button>}
                </div>
              </div>
              <div className="mt-5 relative">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <Input placeholder="Çalışılan Kaynak / Konu Notu..." value={sub.source} onChange={(e) => updateSubject(index, 'source', e.target.value)} className="pl-10 h-10 bg-slate-50/30 border-none rounded-lg text-[11px] italic font-medium" />
              </div>
            </Card>
          ))}
        </div>

        <Button disabled={submitting} className="w-full h-20 rounded-[2rem] bg-slate-900 text-white font-black text-xl hover:bg-blue-600 transition-all shadow-2xl shadow-slate-200 mt-6 flex items-center justify-center gap-4">
          {submitting ? <Loader2 className="animate-spin" /> : <><Save size={26} /> Raporu Koçuma Gönder</>}
        </Button>
      </form>
    </div>
  );
}

export default function DailyReportPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center font-black animate-pulse uppercase italic tracking-widest text-blue-600">Sistem Yükleniyor...</div>}>
      <DailyReportContent />
    </Suspense>
  );
}
