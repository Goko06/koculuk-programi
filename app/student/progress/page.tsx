'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import {
  Trophy, Calendar, Activity, ArrowLeft, Zap, Target,
  BarChart3, Sparkles, TrendingUp, Clock, CheckCircle2,
  ChevronRight, BookOpen, Brain, BookMarked, Medal
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const MOTIVATION_QUOTES = [
  "Başarı, her gün tekrarlanan küçük çabaların toplamıdır.",
  "Zorluklar, yeteneklerinizi ortaya çıkaran fırsatlardır.",
  "Gelecek, bugün hazırlananlara aittir.",
  "Düşle, inan ve gerçekleştir. Sınır sensin!",
  "Yorulunca dinlenmeyi öğren, bırakmayı değil.",
  "Bugünkü acın, yarınki gücün olacak.",
  "En büyük zafer, hiç düşmemek değil, her düştüğünde kalkabilmektir."
];

export default function ProgressPage() {
  const [profile, setProfile] = useState<any>(null);
  const [examEntries, setExamEntries] = useState<any[]>([]);
  const [dailyEntries, setDailyEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuote, setActiveQuote] = useState("");
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const lastQuoteDate = localStorage.getItem('last_quote_date');
    const savedQuote = localStorage.getItem('active_quote');
    const today = new Date();
    if (!lastQuoteDate || !savedQuote || differenceInDays(today, new Date(lastQuoteDate)) >= 3) {
      const newQuote = MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
      setActiveQuote(newQuote);
      localStorage.setItem('active_quote', newQuote);
      localStorage.setItem('last_quote_date', today.toISOString());
    } else { setActiveQuote(savedQuote); }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: pData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(pData);
      const { data: exams } = await supabase.from('exams').select('*').eq('student_id', user.id).order('exam_date', { ascending: true });
      setExamEntries(exams || []);
      const { data: entries } = await supabase.from('daily_entries').select('*').eq('student_id', user.id).order('entry_date', { ascending: false });
      setDailyEntries(entries || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = useMemo(() => {
    let totalQ = 0; let totalBookPages = 0; let totalMinutes = 0; let lastBookName = "";
    dailyEntries.forEach(entry => {
      totalMinutes += (Number(entry.total_duration_minutes) || 0);
      let data = entry.subjects_data;
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { data = {}; } }
      if (data) {
        if (data.book?.pages) {
          totalBookPages += (parseInt(data.book.pages) || 0);
          if (!lastBookName) lastBookName = data.book.name;
        }
        if (data.studies && Array.isArray(data.studies)) {
          data.studies.forEach((s: any) => { totalQ += (parseInt(s.solved) || 0); });
        }
      }
    });
    const goalStep = 1000;
    const currentLevel = Math.floor(totalBookPages / goalStep) + 1;
    const progressInLevel = totalBookPages % goalStep;
    const progressPercent = (progressInLevel / goalStep) * 100;
    return { totalQ, totalBookPages, totalHours: (totalMinutes / 60).toFixed(1), currentLevel, progressPercent, lastBookName };
  }, [dailyEntries]);

  // Sınav Türlerine Göre Filtreleme
  const tytExams = useMemo(() => examEntries.filter(e => e.exam_type === 'TYT'), [examEntries]);
  const aytExams = useMemo(() => examEntries.filter(e => e.exam_type === 'AYT'), [examEntries]);
  const lgsExams = useMemo(() => examEntries.filter(e => e.exam_type === 'LGS'), [examEntries]);

  const isLGS = ["5", "6", "7", "8"].includes(profile?.class_level?.toString());

  if (loading) return <div className="h-screen flex items-center justify-center bg-white font-black animate-pulse text-blue-600 italic">ANALİZLER HESAPLANIYOR...</div>;

  // Grafik Bileşeni
  const CustomChart = ({ data, color, title, gradientId }: any) => (
    <Card className="p-8 rounded-[3.5rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden mb-8">
      <h2 className="text-xl font-black uppercase italic tracking-tight text-slate-800 flex items-center gap-3 mb-6">
        <Zap className={color === '#2563eb' ? 'text-blue-500' : 'text-orange-500'} /> {title} Gelişimi
      </h2>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="exam_date" tickFormatter={(str) => format(new Date(str), 'd MMM', { locale: tr })} fontSize={10} fontWeight="bold" stroke="#94a3b8" />
            <YAxis fontSize={10} fontWeight="bold" stroke="#94a3b8" axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} labelFormatter={(val) => format(new Date(val), 'd MMMM', { locale: tr })} />
            <Area type="monotone" dataKey="total_net" stroke={color} strokeWidth={5} fill={`url(#${gradientId})`} fillOpacity={1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-[#FAFAFB] min-h-screen pb-32 font-sans text-slate-900">
      
      {/* ÜST PANEL */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 gap-8">
        <div className="flex items-center gap-6 w-full">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full w-14 h-14 p-0 bg-slate-50 hover:bg-slate-900 hover:text-white transition-all"><ArrowLeft size={24} /></Button>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3"><TrendingUp className="text-blue-600" /> Gelişim Analizi</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] italic">{profile?.full_name} • {profile?.class_level}. Sınıf</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full lg:w-auto">
          <div className="bg-slate-900 text-white p-5 rounded-[2rem] text-center shadow-xl shadow-slate-200 min-w-[130px]">
            <p className="text-[8px] font-black uppercase opacity-50 mb-1 italic tracking-widest leading-none">Toplam Soru</p>
            <h3 className="text-3xl font-black italic tracking-tighter tabular-nums">{stats.totalQ}</h3>
          </div>
          <div className="bg-blue-600 text-white p-5 rounded-[2rem] text-center shadow-xl shadow-blue-100 min-w-[130px]">
            <p className="text-[8px] font-black uppercase opacity-70 mb-1 italic tracking-widest leading-none">Okuma (S)</p>
            <h3 className="text-3xl font-black italic tracking-tighter tabular-nums">{stats.totalBookPages}</h3>
          </div>
          <div className="bg-emerald-500 text-white p-5 rounded-[2rem] text-center shadow-xl shadow-emerald-100 min-w-[130px]">
            <p className="text-[8px] font-black uppercase opacity-70 mb-1 italic tracking-widest leading-none">Odak (Saat)</p>
            <h3 className="text-3xl font-black italic tracking-tighter tabular-nums">{stats.totalHours}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-0">
          
          {/* DINAMIK GRAFIKLER */}
          {isLGS ? (
            <CustomChart data={lgsExams} color="#10b981" title="LGS Puan" gradientId="colorLgs" />
          ) : (
            <>
              <CustomChart data={tytExams} color="#2563eb" title="TYT Net" gradientId="colorTyt" />
              <CustomChart data={aytExams} color="#f97316" title="AYT Net" gradientId="colorAyt" />
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            {/* KİTAP HEDEFİ */}
            <Card className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                  <h3 className="text-[10px] font-black uppercase italic text-slate-400 flex items-center gap-2 tracking-widest italic"><BookMarked size={16} className="text-blue-500" /> Kitap Kurdu</h3>
                  <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full text-blue-600 font-black text-[9px] uppercase italic tracking-tighter shadow-sm border border-blue-100"><Medal size={12} /> Seviye {stats.currentLevel}</div>
               </div>
               <div className="flex items-end gap-3 mb-4">
                  <span className="text-6xl font-black italic text-slate-900 leading-none tracking-tighter tabular-nums">{stats.totalBookPages}</span>
                  <div className="flex flex-col mb-1 leading-none"><span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest italic leading-none">Toplam</span><span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest italic leading-none">Sayfa</span></div>
               </div>
               <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner mb-3">
                  <div className={`h-full transition-all duration-1000 ${stats.progressPercent > 80 ? 'bg-amber-500' : 'bg-blue-600'}`} style={{ width: `${stats.progressPercent}%` }} />
               </div>
               <div className="flex justify-between items-center px-1"><span className="text-[9px] font-bold text-slate-400 uppercase italic">Sonraki Seviye: {1000 - (stats.totalBookPages % 1000)} Sayfa</span><span className="text-[9px] font-black text-blue-600 uppercase italic tracking-tighter">%{Math.round(stats.progressPercent)}</span></div>
            </Card>

            {/* MOTİVASYON */}
            <Card className="p-8 rounded-[3rem] bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[240px]">
               <Sparkles className="absolute -right-6 -top-6 text-white/5" size={160} />
               <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.4em] mb-4 italic">Motivasyon</p>
               <h3 className="text-lg font-black italic leading-tight tracking-tighter relative z-10 italic">"{activeQuote}"</h3>
            </Card>
          </div>
        </div>

        {/* SAĞ TARAF: SON RAPORLAR */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
            <h2 className="text-xl font-black uppercase italic tracking-tight text-slate-800 flex items-center gap-3 mb-8"><Calendar className="text-blue-600" /> Son Raporlar</h2>
            <div className="space-y-5 overflow-y-auto max-h-[850px] pr-2 no-scrollbar">
              {dailyEntries.map((entry, idx) => {
                let data = entry.subjects_data;
                if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { data = {}; } }
                const dailyTotalQ = (data.studies && Array.isArray(data.studies)) ? data.studies.reduce((a: number, b: any) => a + (parseInt(b.solved) || 0), 0) : 0;
                return (
                  <div key={idx} className="p-6 rounded-[2.5rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-center mb-4"><span className="text-[9px] font-black text-slate-400 uppercase italic tracking-widest">{format(new Date(entry.entry_date), 'd MMMM EEEE', { locale: tr })}</span><div className="text-2xl transform group-hover:scale-110 transition-transform drop-shadow-sm">{entry.mood || '😐'}</div></div>
                    <div className="grid grid-cols-2 gap-6 border-t border-slate-200/40 pt-5"><div className="flex flex-col"><span className="text-base font-black text-slate-800 tracking-tighter italic tabular-nums">{entry.total_duration_minutes || 0} DK</span><span className="text-[8px] font-bold text-slate-400 uppercase italic tracking-tighter italic leading-none">ODAK SÜRESİ</span></div><div className="flex flex-col border-l border-slate-200/40 pl-6"><span className="text-base font-black text-blue-600 tracking-tighter italic tabular-nums">{dailyTotalQ} SORU</span><span className="text-[8px] font-bold text-slate-400 uppercase italic tracking-tighter italic leading-none">PERFORMANS</span></div></div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
