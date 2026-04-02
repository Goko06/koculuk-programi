'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Eğer kullanılıyorsa bunu da ekle
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle2, Circle, BookOpen, 
  ArrowLeft, Search, Loader2, Sparkles, 
  ChevronDown, ChevronUp, GraduationCap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Örnek Müfredat (Gerçek veride bu DB'den gelebilir, şimdilik sabitliyoruz)
const SYLLABUS = {
  "Matematik": ["Temel Kavramlar", "Sayı Basamakları", "Bölme-Bölünebilme", "EBOB-EKOK", "Rasyonel Sayılar", "Üslü Sayılar", "Köklü Sayılar", "Çarpanlara Ayırma", "Denklem Çözme"],
  "Türkçe": ["Sözcük Anlamı", "Cümle Anlamı", "Paragraf", "Ses Bilgisi", "Yazım Kuralları", "Noktalama İşaretleri", "Sözcük Yapısı"],
  "Fizik": ["Fizik Bilimine Giriş", "Madde ve Özellikleri", "Hareket ve Kuvvet", "Enerji", "Isı ve Sıcaklık", "Elektrostatik"]
};

export default function CurriculumPage() {
  const [loading, setLoading] = useState(true);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [searchTerm, setSearchQuery] = useState("");
  const [expandedSubject, setExpandedSubject] = useState<string | null>("Matematik");
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('student_subject_progress')
          .select('topic_name')
          .eq('student_id', user.id)
          .eq('is_completed', true);

        if (data) setCompletedTopics(data.map(t => t.topic_name));
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchProgress();
  }, [supabase]);

  const toggleTopic = async (subject: string, topic: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isFinished = completedTopics.includes(topic);
      
      if (isFinished) {
        await supabase.from('student_subject_progress').delete().eq('student_id', user.id).eq('topic_name', topic);
        setCompletedTopics(prev => prev.filter(t => t !== topic));
      } else {
        await supabase.from('student_subject_progress').upsert({
          student_id: user.id,
          subject_name: subject,
          topic_name: topic,
          is_completed: true
        });
        setCompletedTopics(prev => [...prev, topic]);
        toast.success(`Harika! ${topic} konusunu bitirdin. 🎯`);
      }
    } catch (error) { toast.error("Güncellenemedi."); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-10 bg-slate-50 min-h-screen text-slate-900 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full w-12 h-12 p-0 bg-slate-50">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Müfredat Takibi</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">Hangi Konuda Neredesin?</p>
          </div>
        </div>
        <div className="relative w-full md:w-64">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
           <Input 
            placeholder="Konu ara..." 
            className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold"
            onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
      </div>

      {/* DERS LİSTESİ */}
      <div className="space-y-6">
        {Object.entries(SYLLABUS).map(([subject, topics]) => {
          const finishedCount = topics.filter(t => completedTopics.includes(t)).length;
          const percent = Math.round((finishedCount / topics.length) * 100);
          const isExpanded = expandedSubject === subject;

          return (
            <Card key={subject} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden transition-all">
              <div 
                onClick={() => setExpandedSubject(isExpanded ? null : subject)}
                className="p-8 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-6">
                   <div className={`p-4 rounded-2xl ${percent === 100 ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white shadow-lg'}`}>
                      <BookOpen size={24} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black tracking-tight uppercase italic">{subject}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                         {finishedCount} / {topics.length} KONU TAMAMLANDI
                      </p>
                   </div>
                </div>
                <div className="flex items-center gap-8">
                   <div className="hidden md:block w-32">
                      <div className="flex justify-between text-[10px] font-black mb-1 italic">
                        <span>%{percent}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }} />
                      </div>
                   </div>
                   {isExpanded ? <ChevronUp className="text-slate-300" /> : <ChevronDown className="text-slate-300" />}
                </div>
              </div>

              {isExpanded && (
                <CardContent className="p-8 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {topics.filter(t => t.toLowerCase().includes(searchTerm.toLowerCase())).map((topic) => {
                    const isDone = completedTopics.includes(topic);
                    return (
                      <div 
                        key={topic}
                        onClick={() => toggleTopic(subject, topic)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${isDone ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}
                      >
                        <span className={`text-sm font-black italic tracking-tight ${isDone ? 'text-emerald-700' : 'text-slate-600'}`}>{topic}</span>
                        <div className={`transition-all ${isDone ? 'text-emerald-500' : 'text-slate-200 group-hover:text-blue-400'}`}>
                           {isDone ? <CheckCircle2 size={24} fill="currentColor" className="text-white bg-emerald-500 rounded-full" /> : <Circle size={24} />}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* MOTİVASYON ALT BAR */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
         <div className="relative z-10 space-y-2">
            <h4 className="text-2xl font-black italic">Büyük Resme Bak! 🏔️</h4>
            <p className="text-slate-400 font-bold text-sm">Tüm müfredatın %{Math.round((completedTopics.length / Object.values(SYLLABUS).flat().length) * 100)}'sini tamamladın.</p>
         </div>
         <Button className="relative z-10 bg-white text-slate-900 rounded-2xl h-14 px-10 font-black hover:bg-blue-50 transition-all">
            Çalışmaya Devam <Sparkles size={18} className="ml-2 text-blue-600" />
         </Button>
         <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full" />
      </div>

    </div>
  );
}
