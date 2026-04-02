'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, CheckCircle2, Clock, BarChart3, Loader2, 
  BookOpen, MessageSquare, Target, Activity, Send, TrendingUp, Calendar,
  Award, School, Rocket, Sparkles, Zap, GraduationCap, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Öğrenci sayfasındakiyle aynı müfredat yapısı
const SYLLABUS: any = {
  "Matematik": ["Temel Kavramlar", "Sayı Basamakları", "Bölme-Bölünebilme", "EBOB-EKOK", "Rasyonel Sayılar", "Üslü Sayılar", "Köklü Sayılar", "Çarpanlara Ayırma", "Denklem Çözme"],
  "Türkçe": ["Sözcük Anlamı", "Cümle Anlamı", "Paragraf", "Ses Bilgisi", "Yazım Kuralları", "Noktalama İşaretleri", "Sözcük Yapısı"],
  "Fizik": ["Fizik Bilimine Giriş", "Madde ve Özellikleri", "Hareket ve Kuvvet", "Enerji", "Isı ve Sıcaklık", "Elektrostatik"]
};

export default function CoachStudentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [student, setStudent] = useState<any>(null);
  const [target, setTarget] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [dailyEntries, setDailyEntries] = useState<any[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<any[]>([]); // KONU TAKİBİ İÇİN STATE
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      
      // 1. Öğrenci & Hedef Bilgisi
      const { data: sData } = await supabase.from('students').select('*').eq('id', id).single();
      const { data: tData } = await supabase.from('student_targets').select('*').eq('student_id', id).maybeSingle();
      
      // 2. Konu Takibi Verileri (YENİ)
      const { data: pData } = await supabase.from('student_subject_progress').select('*').eq('student_id', id).eq('is_completed', true);

      // 3. Deneme & Günlük Raporlar
      const { data: eData } = await supabase.from('exams').select('*').eq('student_id', id).order('exam_date', { ascending: true });
      const { data: dData } = await supabase.from('daily_entries').select('*').eq('student_id', id).order('entry_date', { ascending: false }).limit(5);

      setStudent(sData);
      setTarget(tData);
      setSubjectProgress(pData || []);
      setExams(eData || []);
      setDailyEntries(dData || []);

    } catch (error) { console.error("Hata:", error); } finally { setLoading(false); }
  }, [id, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Net Ortalamaları
  const avgs = {
    tyt: exams.filter(e => e.exam_type === 'TYT').length > 0 ? Number((exams.filter(e => e.exam_type === 'TYT').reduce((acc, curr) => acc + curr.total_net, 0) / exams.filter(e => e.exam_type === 'TYT').length).toFixed(1)) : 0,
    ayt: exams.filter(e => e.exam_type === 'AYT').length > 0 ? Number((exams.filter(e => e.exam_type === 'AYT').reduce((acc, curr) => acc + curr.total_net, 0) / exams.filter(e => e.exam_type === 'AYT').length).toFixed(1)) : 0
  };

  const handleSaveFeedback = async (entryId: string) => {
    if (!feedback[entryId]) return;
    setSubmitting(entryId);
    const { error } = await supabase.from('daily_entries').update({ coach_note: feedback[entryId] }).eq('id', entryId);
    if (!error) { toast.success("Not iletildi."); fetchData(); }
    setSubmitting(null);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600 h-12 w-12" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 bg-slate-50 min-h-screen text-slate-900 font-sans">
      
      {/* ÜST PANEL */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-2xl px-6 h-12 font-bold bg-slate-50">
          <ArrowLeft size={18} className="mr-2" /> Geri Dön
        </Button>
        <div className="flex gap-3">
           <Button onClick={() => router.push(`/coach/assign-program/${id}`)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-100 font-black px-8 h-12 gap-2">
              <Calendar size={18} /> Programı Düzenle
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SOL: ÖĞRENCİ VE HEDEF ANALİZİ */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-900 p-10 text-white relative overflow-hidden group">
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-10">
                  <div className="flex gap-6 items-center">
                    <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-3xl font-black">{student?.full_name?.charAt(0)}</div>
                    <div>
                      <h2 className="text-3xl font-black tracking-tight">{student?.full_name}</h2>
                      <p className="text-blue-400 font-bold italic">{target ? `${target.university_name} - ${target.department_name}` : 'Hedef Belirlenmedi'}</p>
                    </div>
                  </div>
                  <School size={48} className="opacity-10" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TYT Hedefine Yakınlık</p>
                     <div className="flex justify-between text-xl font-black">
                        <span>%{target ? Math.min(Math.round((avgs.tyt / target.target_net_tyt) * 100), 100) : 0}</span>
                        <span className="text-sm text-slate-500">{avgs.tyt} / {target?.target_net_tyt || 0} Net</span>
                     </div>
                     <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${target ? (avgs.tyt / target.target_net_tyt) * 100 : 0}%` }} />
                     </div>
                  </div>
                  <div className="space-y-3">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AYT Hedefine Yakınlık</p>
                     <div className="flex justify-between text-xl font-black">
                        <span>%{target ? Math.min(Math.round((avgs.ayt / target.target_net_ayt) * 100), 100) : 0}</span>
                        <span className="text-sm text-slate-500">{avgs.ayt} / {target?.target_net_ayt || 0} Net</span>
                     </div>
                     <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-600 rounded-full" style={{ width: `${target ? (avgs.ayt / target.target_net_ayt) * 100 : 0}%` }} />
                     </div>
                  </div>
               </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full" />
          </Card>

          {/* KONU TAKİBİ ANALİZ KARTI (YENİ) */}
          <Card className="rounded-[3rem] border-none shadow-sm bg-white p-10">
            <h3 className="text-xl font-black flex items-center gap-3 italic mb-8"><GraduationCap className="text-blue-600" /> Müfredat İlerleme Durumu</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Object.keys(SYLLABUS).map((subject) => {
                const totalTopics = SYLLABUS[subject].length;
                const completedCount = subjectProgress.filter(p => p.subject_name === subject).length;
                const percent = Math.round((completedCount / totalTopics) * 100);

                return (
                  <div key={subject} className="space-y-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div className="flex justify-between items-center">
                       <span className="font-black text-slate-900 text-sm uppercase italic">{subject}</span>
                       <span className="text-xs font-black text-blue-600">%{percent}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter text-right">{completedCount} / {totalTopics} Konu Bitti</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* NET GRAFİĞİ */}
          <Card className="rounded-[3rem] border-none shadow-sm bg-white p-10">
            <h3 className="text-xl font-black flex items-center gap-3 italic mb-8"><TrendingUp className="text-orange-600" /> Net Gelişim Trendi</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={exams}>
                  <defs><linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="exam_date" tickFormatter={(str) => format(new Date(str), 'd MMM', { locale: tr })} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 11}} />
                  <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="total_net" stroke="#f97316" strokeWidth={5} fillOpacity={1} fill="url(#colorNet)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* SAĞ: GÜNLÜK RAPORLAR VE NOTLAR */}
        <div className="lg:col-span-4 space-y-8">
          <h2 className="text-xl font-black flex items-center gap-2 px-2 italic"><Activity className="text-blue-600" /> Günlük Raporlar</h2>
          {dailyEntries.map((entry) => (
            <Card key={entry.id} className="bg-white rounded-[2.5rem] border-none shadow-sm overflow-hidden group">
              <div className="bg-slate-50/50 p-5 border-b flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <span className="text-2xl">{entry.mood || '😐'}</span>
                    <span className="font-black text-slate-800 text-sm">{format(new Date(entry.entry_date), 'dd MMM EEEE', { locale: tr })}</span>
                 </div>
                 <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">{entry.total_duration_minutes} dk</span>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4 mb-4">
                  {(entry.subjects_data || []).map((sub: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                       <span className="text-xs font-black text-slate-700">{sub.subject}</span>
                       <span className="text-[10px] font-bold text-emerald-600">{sub.correct}D / {sub.wrong}Y</span>
                    </div>
                  ))}
                </div>
                <div className="relative">
                  <textarea 
                    className="w-full min-h-[80px] p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none"
                    placeholder="Geri bildirim yaz..."
                    value={feedback[entry.id] || entry.coach_note || ""}
                    onChange={(e) => setFeedback({ ...feedback, [entry.id]: e.target.value })}
                  />
                  <Button disabled={submitting === entry.id} onClick={() => handleSaveFeedback(entry.id)} className="absolute bottom-2 right-2 bg-slate-900 text-white hover:bg-blue-600 h-8 w-8 rounded-lg p-0">
                    <Send size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
