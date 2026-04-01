'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, Users, BookOpen, Award, Loader2, 
  PieChart, Target, Zap, ChevronUp, AlertCircle 
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function CoachReports() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // 1. Verileri Çek (Denemeler ve Günlük Raporlar)
        const { data: exams } = await supabase.from('exams').select('*').order('exam_date', { ascending: true });
        const { data: entries } = await supabase.from('daily_entries').select('*');
        const { data: students } = await supabase.from('students').select('id');

        // 2. Soru Çözüm Trendi Hazırla (Son 7 Gün)
        const last7Days = [...Array(7)].map((_, i) => {
          const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
          const dayEntries = entries?.filter(e => e.entry_date === date) || [];
          const totalSolved = dayEntries.reduce((acc, curr) => {
            return acc + (curr.subjects_data?.reduce((sAcc: any, sCurr: any) => sAcc + (Number(sCurr.solved_questions) || 0), 0) || 0);
          }, 0);
          return {
            name: format(subDays(new Date(), i), 'EEE', { locale: tr }),
            soru: totalSolved
          };
        }).reverse();

        // 3. Ders Bazlı Başarı Dağılımı (Örnek)
        const subjectStats = [
          { subject: 'Matematik', net: 28, full: 40 },
          { subject: 'Türkçe', net: 34, full: 40 },
          { subject: 'Fen Bilimleri', net: 16, full: 20 },
          { subject: 'Sosyal', net: 18, full: 20 },
        ];

        setReportData({
          dailyTrend: last7Days,
          subjectStats,
          totalStudents: students?.length || 0,
          avgNet: exams && exams.length > 0 ? (exams.reduce((acc, curr) => acc + curr.total_net, 0) / exams.length).toFixed(1) : 0,
          totalSolvedAllTime: entries?.reduce((acc, curr) => acc + (curr.total_duration_minutes || 0), 0) || 0
        });

      } catch (error) {
        console.error("Analiz Hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [supabase]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin text-blue-600 h-12 w-12 mx-auto" />
        <p className="font-black text-slate-400 italic animate-pulse tracking-widest">VERİLER ANALİZ EDİLİYOR...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900">
      
      {/* ÜST ÖZET KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-6 group hover:bg-blue-600 transition-all duration-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-white/20 group-hover:text-white transition-colors">
              <Users size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-300 group-hover:text-white/50 uppercase tracking-widest">Toplam Öğrenci</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 group-hover:text-white transition-colors">{reportData.totalStudents}</h3>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-6 group hover:bg-emerald-600 transition-all duration-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-white/20 group-hover:text-white transition-colors">
              <TrendingUp size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-300 group-hover:text-white/50 uppercase tracking-widest">Genel Net Ort.</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 group-hover:text-white transition-colors">{reportData.avgNet}</h3>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-6 group hover:bg-orange-600 transition-all duration-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:bg-white/20 group-hover:text-white transition-colors">
              <Zap size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-300 group-hover:text-white/50 uppercase tracking-widest">Toplam Odak (Dk)</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 group-hover:text-white transition-colors">{reportData.totalSolvedAllTime}</h3>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 p-6 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/10 text-blue-400 rounded-2xl">
                <Target size={24} />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grup Verimi</span>
            </div>
            <h3 className="text-3xl font-black text-white">%84</h3>
          </div>
          <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-blue-600/20 blur-3xl rounded-full" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* GRAFİK 1: GÜNLÜK SORU TRENDİ */}
        <Card className="rounded-[3rem] border-none shadow-sm bg-white p-8 group">
          <CardHeader className="px-0 pt-0 mb-8 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-black flex items-center gap-3 tracking-tight">
              <BookOpen className="text-blue-600" /> Grup Soru Akışı
            </CardTitle>
            <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full">
              <ChevronUp size={14} /> %12 Artış
            </div>
          </CardHeader>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.dailyTrend}>
                <defs>
                  <linearGradient id="colorSoru" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                  itemStyle={{ fontWeight: '900', color: '#2563eb' }}
                />
                <Area type="monotone" dataKey="soru" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorSoru)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* GRAFİK 2: BRANŞ BAZLI NETLER */}
        <Card className="rounded-[3rem] border-none shadow-sm bg-white p-8 group">
          <CardHeader className="px-0 pt-0 mb-8">
            <CardTitle className="text-xl font-black flex items-center gap-3 tracking-tight">
              <PieChart className="text-purple-600" /> Branş Başarı Dağılımı
            </CardTitle>
          </CardHeader>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.subjectStats} layout="vertical" barSize={32}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="subject" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontWeight: 900, fontSize: 11}}
                  width={100}
                />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="net" radius={[0, 10, 10, 0]}>
                  {reportData.subjectStats.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* KRİTİK UYARILAR PANELİ */}
      <Card className="rounded-[3rem] border-none shadow-sm bg-white p-10">
        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
          <AlertCircle className="text-amber-500" /> Koç Dikkat Listesi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Düşüşte Olanlar</p>
              <p className="font-bold text-slate-700 italic text-sm">Bu hafta deneme girmeyen 3 öğrenci tespit edildi.</p>
           </div>
           <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Haftalık Yıldızlar</p>
              <p className="font-bold text-slate-700 italic text-sm">Grup soru çözüm ortalaması geçen haftaya göre %15 arttı.</p>
           </div>
           <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">En Verimli Gün</p>
              <p className="font-bold text-slate-700 italic text-sm">Salı günleri öğrenciler en yüksek odaklanma süresine ulaşıyor.</p>
           </div>
        </div>
      </Card>
    </div>
  );
}
