'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { 
  Trophy, Calendar, Activity, 
  ArrowLeft, Zap, Target, 
  BarChart3, Sparkles, TrendingUp,
  Clock, CheckCircle2, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ResponsiveContainer as ReContainer 
} from 'recharts';

export default function ProgressPage() {
  const [student, setStudent] = useState<any>(null);
  const [examEntries, setExamEntries] = useState<any[]>([]);
  const [dailyEntries, setDailyEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sData } = await supabase.from('students').select('*').eq('id', user.id).single();
      setStudent(sData);

      const { data: daily } = await supabase.from('daily_entries').select('*').eq('student_id', user.id).order('entry_date', { ascending: false }).limit(14);
      const { data: exams } = await supabase.from('exams').select('*').eq('student_id', user.id).order('exam_date', { ascending: true });

      setDailyEntries(daily || []);
      setExamEntries(exams || []);
    } catch (error) {
      toast.error("Veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isLGS = ["5", "6", "7", "8"].includes(student?.grade_level);
  
  // Veri Filtreleme
  const tytExams = useMemo(() => examEntries.filter(e => e.exam_type === 'TYT'), [examEntries]);
  const aytExams = useMemo(() => examEntries.filter(e => e.exam_type === 'AYT'), [examEntries]);
  const lgsExams = useMemo(() => examEntries.filter(e => e.exam_type === 'LGS'), [examEntries]);

  const getAvg = (list: any[]) => list.length > 0 
    ? (list.reduce((acc, curr) => acc + curr.total_net, 0) / list.length).toFixed(1) 
    : "0";

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse uppercase tracking-widest text-xs">Veriler Analiz Ediliyor...</div>;

  // Grafik Bileşeni
  const RenderChart = ({ data, color, title }: { data: any[], color: string, title: string }) => (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`color${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="exam_date" 
            tickFormatter={(str) => format(new Date(str), 'd MMM', { locale: tr })}
            fontSize={10} fontWeight="bold" stroke="#94a3b8"
          />
          <YAxis fontSize={10} fontWeight="bold" stroke="#94a3b8" axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            labelFormatter={(val) => format(new Date(val), 'd MMMM yyyy', { locale: tr })}
          />
          <Area type="monotone" dataKey="total_net" stroke={color} strokeWidth={4} fillOpacity={1} fill={`url(#color${title})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 pb-32 font-sans">
      
      {/* HEADER & ÖZET KARTLARI */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-6 w-full">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full w-14 h-14 p-0 bg-slate-50 hover:bg-slate-900 hover:text-white transition-all">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase flex items-center gap-3">
               <TrendingUp className="text-blue-600" /> Analiz Merkezi
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Performans ve Gelişim Takibi</p>
          </div>
        </div>
        
        <div className="flex gap-4 w-full lg:w-auto">
          {isLGS ? (
            <div className="flex-1 bg-orange-500 text-white p-6 px-10 rounded-[2.5rem] text-center min-w-[220px] shadow-xl shadow-orange-100">
              <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">LGS Puan Ortalaması</p>
              <h3 className="text-4xl font-black italic mt-1">{getAvg(lgsExams)}</h3>
            </div>
          ) : (
            <>
              <div className="flex-1 bg-blue-600 text-white p-6 px-8 rounded-[2.5rem] text-center min-w-[140px] shadow-xl shadow-blue-100">
                <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">TYT Net Ort.</p>
                <h3 className="text-3xl font-black italic mt-1">{getAvg(tytExams)}</h3>
              </div>
              <div className="flex-1 bg-slate-900 text-white p-6 px-8 rounded-[2.5rem] text-center min-w-[140px] shadow-xl shadow-slate-200">
                <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">AYT Net Ort.</p>
                <h3 className="text-3xl font-black italic mt-1">{getAvg(aytExams)}</h3>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* SOL: GRAFİKLER */}
        <div className="lg:col-span-8 space-y-8">
          {isLGS ? (
            <Card className="p-8 rounded-[3rem] border-none shadow-sm bg-white">
              <h2 className="text-2xl font-black uppercase italic tracking-tight text-orange-500 flex items-center gap-3 mb-6">
                <Trophy /> LGS Puan Gelişimi
              </h2>
              {lgsExams.length > 0 ? <RenderChart data={lgsExams} color="#f97316" title="LGS" /> : <EmptyState />}
            </Card>
          ) : (
            <>
              <Card className="p-8 rounded-[3rem] border-none shadow-sm bg-white">
                <h2 className="text-2xl font-black uppercase italic tracking-tight text-blue-600 flex items-center gap-3 mb-6">
                  <Zap /> TYT Net Seyri
                </h2>
                {tytExams.length > 0 ? <RenderChart data={tytExams} color="#2563eb" title="TYT" /> : <EmptyState />}
              </Card>
              <Card className="p-8 rounded-[3rem] border-none shadow-sm bg-white">
                <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 flex items-center gap-3 mb-6">
                  <Target /> AYT Net Seyri
                </h2>
                {aytExams.length > 0 ? <RenderChart data={aytExams} color="#0f172a" title="AYT" /> : <EmptyState />}
              </Card>
            </>
          )}
        </div>

        {/* SAĞ: GÜNLÜK ÇALIŞMALAR */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="rounded-[3rem] border-none shadow-sm bg-white p-8">
              <h2 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3 mb-8">
                 <BarChart3 className="text-emerald-500" /> Günlük Odak
              </h2>
              <div className="space-y-6">
                {dailyEntries.length === 0 ? <EmptyState tiny /> : 
                dailyEntries.map((entry, i) => (
                  <div key={i} className="flex items-center gap-4 group bg-slate-50 p-4 rounded-3xl hover:bg-slate-100 transition-all">
                    <div className="w-1.5 h-12 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {format(new Date(entry.entry_date), 'd MMMM EEEE', { locale: tr })}
                      </p>
                      <h4 className="font-bold text-slate-700 flex items-center gap-2">
                        {entry.total_duration_minutes} Dakika <Sparkles size={12} className="text-orange-400" />
                      </h4>
                    </div>
                    <div className="bg-white p-2 rounded-xl shadow-sm">
                       <CheckCircle2 size={18} className="text-emerald-500" />
                    </div>
                  </div>
                ))}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

const EmptyState = ({ tiny }: { tiny?: boolean }) => (
  <div className={`flex flex-col items-center justify-center ${tiny ? 'py-10' : 'py-20'} text-slate-300`}>
    <Activity size={tiny ? 24 : 48} className="mb-4 opacity-20" />
    <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Henüz Veri Girişi Yok</p>
  </div>
);
