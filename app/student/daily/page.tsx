'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BookOpen, Clock, Send, Plus, Trash2,
  Smile, Meh, Frown, Loader2, ArrowLeft, Sparkles, MessageSquare, Book
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
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
  const [user, setUser] = useState<any>(null);
  const [studentLevel, setStudentLevel] = useState('12');
  
  const [mood, setMood] = useState('😐');
  const [totalDuration, setTotalDuration] = useState(pomodoroValue || '');
  const [generalNote, setGeneralNote] = useState('');
  const [subjects, setSubjects] = useState<any[]>([
    { subject: '', solved: '', correct: '', wrong: '', duration: '', source: '' }
  ]);
  const [bookData, setBookData] = useState({ name: '', author: '', pages: '' });

  useEffect(() => {
    async function getStudentInfo() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser(authUser);
        const { data: profile } = await supabase.from('profiles').select('class_level').eq('id', authUser.id).single();
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
    if (!user) return toast.error("Oturum hatası.");
    setSubmitting(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('coach_id, full_name').eq('id', user.id).single();

      const { error: entryError } = await supabase.from('daily_entries').insert([{
        student_id: user.id,
        entry_date: new Date().toISOString().split('T')[0],
        mood: mood,
        total_duration_minutes: parseInt(totalDuration) || 0,
        notes: generalNote,
        subjects_data: {
          studies: subjects.map(s => ({
            subject: s.subject,
            solved: parseInt(s.solved) || 0,
            correct: parseInt(s.correct) || 0,
            wrong: parseInt(s.wrong) || 0,
            duration: parseInt(s.duration) || 0,
            book_name: s.source
          })),
          book: {
            name: bookData.name,
            author: bookData.author,
            pages: parseInt(bookData.pages) || 0
          }
        }
      }]);

      if (entryError) throw entryError;

      if (profile?.coach_id) {
        await supabase.from('notifications').insert([{
          user_id: profile.coach_id,
          title: "Yeni Rapor! 📝",
          message: `${profile.full_name} rapor gönderdi.`,
          type: 'info',
          is_read: false
        }]);
      }

      toast.success("Rapor gönderildi!");
      router.push('/student');
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-blue-600">YÜKLENİYOR...</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-10 bg-slate-50 min-h-screen pb-32">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-6">
          <Button type="button" onClick={() => router.back()} variant="ghost" className="rounded-full w-14 h-14 bg-slate-50"><ArrowLeft size={24} /></Button>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Günlük Rapor</h1>
        </div>
        <div className="flex bg-slate-100 p-2 rounded-[1.5rem] gap-2">
          {['😞', '😐', '😊'].map((m) => (
            <button key={m} type="button" onClick={() => setMood(m)} className={`p-4 rounded-xl transition-all ${mood === m ? 'bg-white shadow-lg scale-110' : 'text-slate-400 opacity-50'}`}>{m}</button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="rounded-[3rem] border-none shadow-sm bg-white p-10">
          <Label className="font-black text-[10px] uppercase tracking-widest text-blue-600 italic">Toplam Çalışma (Dakika)</Label>
          <Input required type="number" value={totalDuration} onChange={(e) => setTotalDuration(e.target.value)} className="h-16 rounded-2xl border-none bg-blue-50 font-black text-2xl mt-2 outline-none" />
        </Card>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="font-black italic uppercase text-xl tracking-tighter flex items-center gap-2"><Sparkles className="text-blue-500" /> Ders Çalışmaları</h3>
            <Button type="button" onClick={addSubject} variant="outline" className="rounded-2xl font-black uppercase text-[10px]"><Plus size={16} /> Ekle</Button>
          </div>
          {subjects.map((s, index) => (
            <Card key={index} className="rounded-[2.5rem] border-none shadow-sm p-8 bg-white relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Select onValueChange={(v) => updateSubject(index, 'subject', v)} value={s.subject}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Ders Seçin" /></SelectTrigger>
                  <SelectContent className="bg-white rounded-xl">{(SUBJECTS_BY_LEVEL[studentLevel] || []).map((l: string) => <SelectItem key={l} value={l} className="font-bold py-3">{l}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Kaynak Adı ve Konu" value={s.source} onChange={(e) => updateSubject(index, 'source', e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
                <div className="flex gap-2">
                  <Input type="number" placeholder="Süre" value={s.duration} onChange={(e) => updateSubject(index, 'duration', e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-black text-center" />
                  <Input type="number" placeholder="D" value={s.correct} onChange={(e) => updateSubject(index, 'correct', e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-black text-emerald-600 text-center" />
                  <Input type="number" placeholder="Y" value={s.wrong} onChange={(e) => updateSubject(index, 'wrong', e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-black text-red-500 text-center" />
                </div>
              </div>
              {subjects.length > 1 && <Button type="button" onClick={() => removeSubject(index)} variant="ghost" className="absolute -top-2 -right-2 text-red-400 hover:bg-red-50 rounded-full"><Trash2 size={18} /></Button>}
            </Card>
          ))}
        </div>

        <Card className="rounded-[3rem] border-none shadow-sm bg-white p-10">
          <h3 className="font-black italic uppercase text-xl mb-6 flex items-center gap-2"><BookOpen className="text-amber-500" /> Kitap Okuma</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input placeholder="Kitap Adı" value={bookData.name} onChange={(e) => setBookData({...bookData, name: e.target.value})} className="h-14 rounded-2xl bg-amber-50 border-none font-bold italic" />
            <Input placeholder="Yazar" value={bookData.author} onChange={(e) => setBookData({...bookData, author: e.target.value})} className="h-14 rounded-2xl bg-amber-50 border-none font-bold italic" />
            <Input type="number" placeholder="Sayfa" value={bookData.pages} onChange={(e) => setBookData({...bookData, pages: e.target.value})} className="h-14 rounded-2xl bg-amber-50 border-none font-black text-amber-600" />
          </div>
        </Card>

        <Card className="rounded-[3rem] border-none shadow-sm bg-white p-10">
          <textarea value={generalNote} onChange={(e) => setGeneralNote(e.target.value)} className="w-full h-32 bg-slate-50 rounded-[2rem] border-none p-6 text-sm font-bold outline-none resize-none" placeholder="Bugün nasıl geçti?" />
        </Card>

        <Button disabled={submitting} type="submit" className="fixed bottom-8 left-1/2 -translate-x-1/2 w-64 h-16 rounded-[2rem] bg-blue-600 hover:bg-slate-900 text-white font-black uppercase italic tracking-[0.2em] shadow-2xl transition-all">
          {submitting ? <Loader2 className="animate-spin" /> : 'RAPORU GÖNDER'}
        </Button>
      </form>
    </div>
  );
}

export default function DailyReportPage() {
  return <Suspense><DailyReportContent /></Suspense>;
}
