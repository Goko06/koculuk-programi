'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  BarChart3, Users, Download, TrendingUp, TrendingDown, 
  Target, Zap, Award, GraduationCap, ChevronRight, AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, 
  ResponsiveContainer, Cell
} from 'recharts';
import { toast } from 'sonner';
import { isAdminCoach } from '@/lib/roles';

const THEME = {
  YKS: { primary: '#2563eb', secondary: '#8b5cf6', bg: 'bg-blue-50', text: 'text-blue-600' },
  LGS: { primary: '#f97316', secondary: '#fbbf24', bg: 'bg-orange-50', text: 'text-orange-600' },
  ARA: { primary: '#10b981', secondary: '#06b6d4', bg: 'bg-emerald-50', text: 'text-emerald-600' }
};

type GroupType = 'YKS' | 'LGS' | 'ARA';

export default function ProfessionalReportsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<GroupType>('YKS');
  const [data, setData] = useState<{
    students: any[],
    exams: any[],
    tasks: any[],
    dailyEntries: any[] // Yeni eklendi
  }>({ students: [], exams: [], tasks: [], dailyEntries: [] });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      const studentsQuery = supabase.from('profiles').select('*').eq('role', 'student');
      const { data: sData } = isAdminCoach(profile)
        ? await studentsQuery
        : await studentsQuery.eq('coach_id', user.id);
      
      if (sData && sData.length > 0) {
        const sIds = sData.map(s => s.id);
        const [examsRes, tasksRes, dailyRes] = await Promise.all([
          supabase.from('exams').select('*').in('student_id', sIds),
          supabase.from('student_tasks').select('*').in('student_id', sIds),
          supabase.from('daily_entries').select('*').in('student_id', sIds) // Günlük girişler çekiliyor
        ]);

        setData({
          students: sData,
          exams: examsRes.data || [],
          tasks: tasksRes.data || [],
          dailyEntries: dailyRes.data || []
        });
      } else {
        setData({ students: [], exams: [], tasks: [], dailyEntries: [] });
      }
    } catch (error) {
      toast.error("Veriler çekilemedi.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const groupStats = useMemo(() => {
    const groupStudents = data.students.filter(s => {
      if (activeGroup === 'LGS') return s.class_level === '8';
      if (activeGroup === 'YKS') return s.class_level === '12' || s.class_level === 'mezun';
      return !['8', '12', 'mezun'].includes(s.class_level);
    });

    const sIds = groupStudents.map(s => s.id);
    const groupExams = data.exams.filter(e => sIds.includes(e.student_id));
    const groupTasks = data.tasks.filter(t => sIds.includes(t.student_id));
    const groupDailyEntries = data.dailyEntries.filter(d => sIds.includes(d.student_id));

    const calcAvg = (list: any[]) => list.length > 0 ? (list.reduce((a, c) => a + Number(c.total_net), 0) / list.length).toFixed(1) : "0";

    // GRAFİK VERİSİ HESAPLAMA (GÜNLÜK RAPORLAR DAHİL)
    const chartData = groupStudents.map(s => {
      // 1. Koçun verdiği görevlerden gelen tamamlanmış sorular
      const taskSoru = groupTasks
        .filter(t => t.student_id === s.id && t.status === 'completed')
        .reduce((a, c) => a + (Number(c.completed_questions) || 0), 0);

      // 2. Öğrencinin günlük raporlarından (subjects_data) gelen sorular
      const dailySoru = groupDailyEntries
        .filter(d => d.student_id === s.id)
        .reduce((acc, entry) => {
          const studies = entry.subjects_data?.studies || [];
          const entryTotal = studies.reduce((sAcc: number, study: any) => sAcc + (Number(study.solved) || 0), 0);
          return acc + entryTotal;
        }, 0);

      return {
        name: s.full_name.split(' ')[0],
        soru: taskSoru + dailySoru // Toplam soru sayısı
      };
    }).filter(d => d.soru > 0).sort((a, b) => b.soru - a.soru).slice(0, 6);

    return {
      students: groupStudents,
      tytAvg: calcAvg(groupExams.filter(e => e.exam_type === 'TYT')),
      aytAvg: calcAvg(groupExams.filter(e => e.exam_type === 'AYT')),
      generalAvg: calcAvg(groupExams.filter(e => e.exam_type === 'LGS' || e.exam_type === 'DENEME')),
      taskRatio: groupTasks.length > 0 ? Math.round((groupTasks.filter(t => t.status === 'completed').length / groupTasks.length) * 100) : 0,
      chartData
    };
  }, [data, activeGroup]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse uppercase italic tracking-[0.3em]">ANALİZ EDİLİYOR...</div>;

  const currentTheme = THEME[activeGroup];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 pb-32">
      
      {/* SEÇİCİ HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl rotate-3"><BarChart3 size={32} /></div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Raporlama</h1>
            <div className="flex bg-slate-100 p-1 rounded-xl mt-3 gap-1">
              {(['YKS', 'LGS', 'ARA'] as GroupType[]).map(g => (
                <button key={g} onClick={() => setActiveGroup(g)} className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${activeGroup === g ? `bg-white ${THEME[g].text} shadow-sm` : 'text-slate-400'}`}>
                  {g === 'ARA' ? 'Ara Sınıf' : g}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button onClick={fetchData} className="h-14 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] px-8 hover:bg-blue-600 shadow-lg">Yenile</Button>
      </div>

      {/* METRİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm flex flex-col items-center text-center">
          <div className={`p-3 ${currentTheme.bg} ${currentTheme.text} rounded-xl mb-4`}><Users size={24} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mevcut</p>
          <h3 className="text-4xl font-black italic text-slate-900 leading-none">{groupStats.students.length}</h3>
        </Card>

        {activeGroup === 'YKS' ? (
          <>
            <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm flex flex-col items-center text-center">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mb-4 font-black text-[10px]">TYT</div>
              <h3 className="text-4xl font-black italic text-blue-600 leading-none">{groupStats.tytAvg}</h3>
            </Card>
            <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm flex flex-col items-center text-center">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl mb-4 font-black text-[10px]">AYT</div>
              <h3 className="text-4xl font-black italic text-purple-600 leading-none">{groupStats.aytAvg}</h3>
            </Card>
          </>
        ) : (
          <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-sm flex flex-col items-center text-center lg:col-span-2">
            <div className={`p-3 ${currentTheme.bg} ${currentTheme.text} rounded-xl mb-4 font-black text-[10px]`}>GENEL NET</div>
            <h3 className={`text-4xl font-black italic ${currentTheme.text} leading-none`}>{groupStats.generalAvg}</h3>
          </Card>
        )}

        <Card className={`p-8 rounded-[2.5rem] ${currentTheme.bg} border-none shadow-sm flex flex-col items-center text-center`}>
          <div className="p-3 bg-white text-slate-900 rounded-xl mb-4 shadow-sm"><Zap size={24} /></div>
          <h3 className="text-4xl font-black italic text-slate-900 leading-none">%{groupStats.taskRatio}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Ödev Başarısı</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GRAFİK ALANI */}
        <Card className="lg:col-span-2 p-10 rounded-[3.5rem] bg-white border-none shadow-sm min-h-[450px] flex flex-col">
          <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3 mb-10">
            <Target className={currentTheme.text} /> Soru Çözüm Liderleri
          </h3>
          {groupStats.chartData.length > 0 ? (
            <div className="flex-1 h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupStats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} />
                  <ReTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="soru" radius={8} barSize={50}>
                    {groupStats.chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? currentTheme.primary : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <AlertCircle size={48} strokeWidth={1} />
              <p className="text-[10px] font-black uppercase mt-4 tracking-widest">Henüz ödev verisi girilmemiş</p>
            </div>
          )}
        </Card>

        {/* GRUP ANALİZİ */}
        <Card className="p-10 rounded-[3.5rem] bg-slate-900 text-white border-none shadow-xl relative overflow-hidden group">
           <Award className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5 rotate-12" />
           <div className="relative z-10 space-y-6">
              <div className="inline-block p-3 bg-white/10 rounded-2xl backdrop-blur-md"><GraduationCap className="text-blue-400" size={28} /></div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Grup Analizi</h3>
              <p className="text-slate-400 text-xs font-bold leading-relaxed italic">
                {activeGroup} grubu için sistemde kayıtlı {groupStats.students.length} öğrenci bulunuyor. 
                {groupStats.taskRatio > 0 ? `Ödev tamamlama oranı %${groupStats.taskRatio} seviyesinde seyrediyor.` : 'Ödev tamamlama verisi henüz oluşmadı.'}
              </p>
              <div className="pt-6 border-t border-white/10">
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic mb-2">
                    <span className="text-slate-500">Mevcut Durum</span>
                    <span className={groupStats.taskRatio > 70 ? "text-emerald-400" : "text-amber-400"}>
                      {groupStats.taskRatio > 70 ? "Yüksek Verim" : "Takip Gerekli"}
                    </span>
                 </div>
                 <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${currentTheme.primary}`} style={{ width: `${groupStats.taskRatio}%` }} />
                 </div>
              </div>
           </div>
        </Card>
      </div>

      {/* ÖĞRENCİ LİSTESİ */}
      <Card className="p-8 rounded-[3rem] bg-white border-none shadow-sm overflow-hidden min-h-[300px]">
        <h3 className="text-lg font-black italic uppercase tracking-tighter mb-8">Grup Öğrenci Listesi</h3>
        {groupStats.students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="pb-4 pl-4">Öğrenci</th>
                  <th className="pb-4">Branş</th>
                  <th className="pb-4">Durum</th>
                  <th className="pb-4 text-right pr-4">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {groupStats.students.map((s, i) => (
                  <tr key={i} className="group hover:bg-slate-50 transition-all cursor-pointer" onClick={() => router.push(`/coach/student/${s.id}`)}>
                    <td className="py-5 pl-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs italic">{s.full_name.charAt(0)}</div>
                      <span className="text-xs font-black uppercase italic text-slate-900">{s.full_name}</span>
                    </td>
                    <td className="py-5 text-[10px] font-bold text-slate-400 uppercase">{s.branch}</td>
                    <td className="py-5">
                       <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase italic text-slate-500">Aktif</span>
                    </td>
                    <td className="py-5 text-right pr-4"><ChevronRight size={16} className="ml-auto text-slate-200 group-hover:text-blue-600" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center opacity-20">
            <Users size={48} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Öğrenci Bulunmamaktadır</p>
          </div>
        )}
      </Card>
    </div>
  );
}
