'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, ArrowLeft, Zap, Target, 
  BarChart3, Calendar, Trophy 
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

export default function ProgressPage() {
  const [examEntries, setExamEntries] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sData } = await supabase.from('students').select('*').eq('id', user.id).single();
      setStudent(sData);

      const { data: exams } = await supabase.from('exams')
        .select('*')
        .eq('student_id', user.id)
        .order('exam_date', { ascending: true }); // Grafik için eskiden yeniye

      setExamEntries(exams || []);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Veri Gruplama
  const tytData = useMemo(() => examEntries.filter(e => e.exam_type === 'TYT'), [examEntries]);
  const aytData = useMemo(() => examEntries.filter(e => e.exam_type === 'AYT'), [examEntries]);
  const isLGS = ["5", "6", "7", "8"].includes(student?.grade_level);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse uppercase tracking-widest text-xs">Analiz Ediliyor...</div>;

  const CustomChart = ({ data, color, title, icon: Icon }: any) => (
    <Card className="rounded-[3rem] border-none shadow-sm bg-white p-8 space-y-6">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-xl font-black uppercase italic flex items-center gap-3" style={{ color }}>
          <Icon size={24} /> {title} Analizi
        </h3>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data.length} Deneme</span>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="exam_date" 
              tickFormatter={(str) => format(new Date(str), 'd MMM', { locale: tr })}
              fontSize={10}
              fontWeight="bold"
              stroke="#cbd5e1"
            />
            <YAxis fontSize={10} fontWeight="bold" stroke="#cbd5e1" axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              labelFormatter={(label) => format(new Date(label), 'd MMMM yyyy', { locale: tr })}
            />
            <Area 
              type="monotone" 
              dataKey="total_net" 
              stroke={color} 
              strokeWidth={4} 
              fillOpacity={1} 
              fill={`url(#color${title})`} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 pb-32">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-6 w-full">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full w-14 h-14 p-0 bg-slate-50 hover:bg-slate-900 hover:text-white transition-all">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase flex items-center gap-3 text-slate-900">
               <TrendingUp className="text-blue-600" /> Gelişimim
            </h1>
          </div>
        </div>
      </div>

      {/* Grafikler Alanı */}
      <div className="grid grid-cols-1 gap-8">
        {!isLGS ? (
          <>
            <CustomChart data={tytData} color="#2563eb" title="TYT" icon={Zap} />
            <CustomChart data={aytData} color="#0f172a" title="AYT" icon={Target} />
          </>
        ) : (
          <CustomChart data={examEntries} color="#f97316" title="LGS" icon={Trophy} />
        )}
      </div>

      {/* Son Eklenenler Listesi */}
      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase italic px-4 flex items-center gap-2">
            <Calendar size={20} className="text-slate-400" /> Son Sınavlar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...examEntries].reverse().slice(0, 6).map((exam, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{exam.exam_type}</p>
                <h4 className="font-bold text-slate-800 truncate max-w-[150px]">{exam.exam_name}</h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black italic text-blue-600">{exam.total_net}</span>
                <p className="text-[9px] font-bold text-slate-300 uppercase">{format(new Date(exam.exam_date), 'dd.MM.yyyy')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
