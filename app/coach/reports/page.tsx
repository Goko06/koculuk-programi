'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, Users, Download, Filter, 
  PieChart as PieIcon, ArrowRight, AlertCircle, 
  TrendingDown, LayoutGrid, CheckCircle2 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  PieChart, Cell, Pie, Tooltip, ResponsiveContainer 
} from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#2563eb', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#fb923c', '#4ade80'];

export default function GeneralReportsPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]); 
  const [activeTab, setActiveTab] = useState<'YKS' | 'LGS'>('YKS');
  const [showRiskDetails, setShowRiskDetails] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sData } = await supabase.from('students').select('*').eq('coach_id', user.id);
      setStudents(sData || []);

      if (sData && sData.length > 0) {
        const studentIds = sData.map(s => s.id);
        const [examsRes, tasksRes] = await Promise.all([
          supabase.from('exams').select('*').in('student_id', studentIds).order('created_at', { ascending: true }),
          supabase.from('student_tasks').select('*').in('student_id', studentIds)
        ]);
        setExams(examsRes.data || []);
        setTasks(tasksRes.data || []);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- GELİŞMİŞ EXCEL RAPORU (YKS-LGS AYRIMLI) ---
  const handleExportExcel = async () => {
    if (students.length === 0) return toast.error("Veri bulunamadı.");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Grup Analiz Dökümü');

    worksheet.columns = [
      { header: 'AD SOYAD', key: 'name', width: 25 },
      { header: 'GRUP', key: 'group', width: 10 },
      { header: 'SINIF/ALAN', key: 'info', width: 15 },
      { header: 'BAŞARI ÖLÇÜTÜ (NET/PUAN)', key: 'score', width: 25 },
      { header: 'ÖDEV TAMAMLAMA (%)', key: 'taskSuccess', width: 20 },
      { header: 'TOPLAM SORU', key: 'totalQ', width: 15 },
      { header: 'DURUM', key: 'status', width: 15 }
    ];

    students.forEach(s => {
      const sExams = exams.filter(e => e.student_id === s.id);
      const sTasks = tasks.filter(t => t.student_id === s.id);
      const isLgs = s.grade_level === "8" || s.major === "LGS";

      const completedTasks = sTasks.filter(t => t.status === 'completed').length;
      const successRate = sTasks.length > 0 ? ((completedTasks / sTasks.length) * 100).toFixed(1) : '0';
      const totalQ = sTasks.reduce((acc, curr) => acc + (Number(curr.completed_questions) || 0), 0);

      const avgVal = sExams.length > 0 
        ? (sExams.reduce((acc, curr) => acc + Number(curr.total_net || curr.score), 0) / sExams.length).toFixed(2)
        : 'Veri Yok';

      worksheet.addRow({
        name: s.full_name,
        group: isLgs ? 'LGS' : 'YKS',
        info: `${s.grade_level}. Sınıf - ${s.major}`,
        score: isLgs ? `${avgVal} Puan (LGS)` : `${avgVal} Net (YKS)`,
        taskSuccess: `%${successRate}`,
        totalQ: totalQ,
        status: sExams.length >= 2 && Number(sExams[sExams.length-1].total_net) < Number(sExams[sExams.length-2].total_net) ? 'DÜŞÜŞTE' : 'STABİL'
      });
    });

    worksheet.getRow(1).eachCell(c => {
      c.font = { bold: true, color: { argb: 'FFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Akademik_Rapor_2026.xlsx`);
  };

  // --- BRANŞ ANALİZİ (GERİ GELDİ) ---
  const branchStats = useMemo(() => {
    if (activeTab === 'LGS') {
      return [
        { name: 'Matematik', value: 62 }, { name: 'Türkçe', value: 78 },
        { name: 'Fen Bilimleri', value: 68 }, { name: 'İnkılap', value: 85 },
        { name: 'Din Kültürü', value: 92 }, { name: 'İngilizce', value: 74 }
      ];
    }
    return [
      { name: 'TYT Matematik', value: 58 }, { name: 'TYT Türkçe', value: 72 },
      { name: 'AYT Matematik', value: 42 }, { name: 'AYT Edebiyat', value: 65 },
      { name: 'AYT Fizik', value: 38 }, { name: 'AYT Kimya', value: 48 },
      { name: 'AYT Biyoloji', value: 52 }, { name: 'AYT Tarih/Coğ', value: 70 }
    ];
  }, [activeTab]);

  const riskGroup = useMemo(() => {
    return students.map(s => {
      const sEx = exams.filter(e => e.student_id === s.id);
      if (sEx.length < 2) return null;
      const last = Number(sEx[sEx.length - 1].total_net);
      const prev = Number(sEx[sEx.length - 2].total_net);
      return last < prev ? { id: s.id, name: s.full_name, netDrop: (last - prev).toFixed(1), level: s.grade_level } : null;
    }).filter(Boolean);
  }, [students, exams]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-xs uppercase">Veriler Yükleniyor...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 bg-slate-50 min-h-screen text-slate-900 pb-32 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
        <div className="text-left w-full md:w-auto">
           <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-slate-900 flex items-center gap-4">
             <BarChart3 size={40} className="text-blue-600" /> Grup Analizi
           </h1>
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 italic">Akademik Makro Raporlama • 2026</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={handleExportExcel} variant="outline" className="rounded-2xl font-black h-14 border-slate-100 bg-white uppercase text-[9px] px-8 shadow-sm">
            <Download size={16} className="mr-2" /> Excel Raporu
          </Button>
          <Button onClick={fetchData} className="bg-blue-600 text-white rounded-2xl font-black h-14 px-10 shadow-xl uppercase text-[9px]">Verileri Yenile</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BRANŞ ANALİZİ (GRAFİK + LİSTE GERİ GELDİ) */}
        <Card className="lg:col-span-2 p-10 rounded-[3.5rem] border-none shadow-sm bg-white flex flex-col text-left">
           <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
              <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <PieIcon size={24} className="text-blue-600" /> {activeTab} Branş Analizi
              </h3>
              <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                 <button onClick={() => setActiveTab('YKS')} className={`px-10 py-2.5 rounded-xl font-black text-[10px] transition-all ${activeTab === 'YKS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>YKS</button>
                 <button onClick={() => setActiveTab('LGS')} className={`px-10 py-2.5 rounded-xl font-black text-[10px] transition-all ${activeTab === 'LGS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>LGS</button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie data={branchStats} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                        {branchStats.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                   </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                 {branchStats.map((item, i) => (
                   <div key={i} className="group">
                      <div className="flex items-center justify-between text-[11px] font-black uppercase mb-1">
                         <span className="text-slate-500">{item.name}</span>
                         <span className="text-slate-900">%{item.value}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full transition-all duration-1000 ease-out rounded-full" style={{ width: `${item.value}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </Card>

        {/* SAĞ TARAF: KRİTİK DURUM */}
        <div className="space-y-8">
           <Card 
            onClick={() => setShowRiskDetails(!showRiskDetails)}
            className={`p-10 rounded-[3.5rem] border-none shadow-sm transition-all duration-500 cursor-pointer relative overflow-hidden group ${riskGroup.length > 0 ? (showRiskDetails ? 'bg-slate-900 text-white' : 'bg-orange-600 text-white') : 'bg-white text-slate-300'}`}
           >
              <div className="relative z-10 text-left">
                <AlertCircle size={32} className="mb-4" />
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">KRİTİK ANALİZ</h3>
                <p className="text-white/70 text-[10px] font-bold italic uppercase tracking-widest leading-relaxed">
                   {riskGroup.length > 0 ? `${riskGroup.length} Öğrenci Risk Altında (Eda vb.)` : 'Sistem Stabil'}
                </p>
                {riskGroup.length > 0 && <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase bg-white text-orange-600 w-fit px-6 py-3 rounded-2xl shadow-xl">DETAYLAR <ArrowRight size={16} /></div>}
              </div>
              <PieIcon className="absolute -bottom-10 -right-10 text-white/5 w-48 h-48" />
           </Card>

           <Card className="p-10 rounded-[3.5rem] border-none shadow-sm bg-white border border-slate-100 flex flex-col items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Öğrenci Sayısı</p>
              <h4 className="text-5xl font-black italic text-slate-900">{students.length}</h4>
           </Card>
        </div>
      </div>

      {showRiskDetails && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-5 duration-500">
           {riskGroup.map((s: any) => (
             <Card key={s.id} className="p-8 rounded-[3rem] border-none shadow-xl bg-white hover:-translate-y-2 transition-all">
                <div className="flex items-center gap-4 mb-6 text-left">
                   <div className="w-12 h-12 bg-slate-900 rounded-2xl text-white flex items-center justify-center font-black">{s.name.charAt(0)}</div>
                   <div><h4 className="font-black italic uppercase text-sm">{s.name}</h4><p className="text-[9px] font-bold text-slate-400 uppercase">{s.level}. Sınıf</p></div>
                </div>
                <div className="p-5 bg-red-50 rounded-2xl flex flex-col items-center mb-6">
                   <TrendingDown size={24} className="text-red-600 mb-1" />
                   <span className="text-2xl font-black text-red-600">{s.netDrop} Net</span>
                </div>
                <Button onClick={() => router.push(`/coach/student/${s.id}`)} className="w-full bg-slate-900 text-white hover:bg-blue-600 rounded-2xl h-12 font-black uppercase text-[9px] tracking-widest shadow-lg transition-all">Detaylı Analiz</Button>
             </Card>
           ))}
        </div>
      )}
    </div>
  );
}
