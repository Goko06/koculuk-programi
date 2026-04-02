'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, TrendingUp, BarChart3, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

export default function StudentExamAnalysis() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('exams').select('*').eq('student_id', user.id).order('exam_date', { ascending: true });
        setExams(data || []);
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchExams();
  }, [supabase]);

  const stats = {
    total: exams.length,
    lastNet: exams.length > 0 ? exams[exams.length - 1].total_net : 0,
    avgNet: exams.length > 0 ? (exams.reduce((acc, curr) => acc + curr.total_net, 0) / exams.length).toFixed(1) : 0,
    bestNet: exams.length > 0 ? Math.max(...exams.map(e => e.total_net)) : 0
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 font-black text-blue-600 animate-pulse uppercase tracking-widest">VERİLER ANALİZ EDİLİYOR...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-orange-600 rounded-[1.5rem] text-white shadow-xl shadow-orange-100"><BarChart3 size={28} /></div>
          <div><h1 className="text-2xl font-black tracking-tight">Deneme Analiz Merkezi</h1><p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 italic">Gelişimini ve Net Artışını Takip Et</p></div>
        </div>
        <Button onClick={() => router.push('/student/exam/add')} className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white rounded-2xl px-8 h-14 font-black shadow-xl shadow-orange-100 flex items-center gap-3"><Plus size={22} /> Yeni Deneme Ekle</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[2rem] border-none shadow-sm bg-white p-6"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Son Netin</p><h3 className="text-3xl font-black text-orange-600">{stats.lastNet}</h3></Card>
        <Card className="rounded-[2rem] border-none shadow-sm bg-white p-6"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Ortalama Net</p><h3 className="text-3xl font-black text-blue-600">{stats.avgNet}</h3></Card>
        <Card className="rounded-[2rem] border-none shadow-sm bg-white p-6"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">En Yüksek Net</p><h3 className="text-3xl font-black text-emerald-600">{stats.bestNet}</h3></Card>
        <Card className="rounded-[2rem] border-none shadow-sm bg-slate-900 p-6"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Toplam Deneme</p><h3 className="text-3xl font-black text-white">{stats.total}</h3></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="rounded-[3rem] border-none shadow-sm bg-white p-8">
            <h3 className="text-xl font-black flex items-center gap-3 italic mb-8"><TrendingUp className="text-orange-600" /> Net Gelişim Grafiği</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={exams}>
                  <defs><linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="exam_date" tickFormatter={(str) => format(new Date(str), 'd MMM', { locale: tr })} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 11}} />
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="total_net" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorNet)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <h2 className="text-xl font-black flex items-center gap-2 px-4 italic tracking-tight uppercase"><Calendar className="text-orange-600" /> Geçmiş</h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {[...exams].reverse().map((exam) => (
              <Card key={exam.id} className="rounded-[2rem] border-none shadow-sm bg-white p-5 hover:shadow-md transition-all group">
                <div className="flex justify-between items-center">
                  <div><h4 className="font-black text-slate-900 group-hover:text-orange-600 transition-colors uppercase italic">{exam.exam_name}</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mt-1">{format(new Date(exam.exam_date), 'dd MMMM yyyy', { locale: tr })}</p></div>
                  <div className="text-right"><span className="text-2xl font-black text-slate-900 leading-none">{exam.total_net}</span><p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">NET</p></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
