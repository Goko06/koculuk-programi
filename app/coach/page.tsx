'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, Search, UserPlus, LayoutGrid, Zap, AlertTriangle, 
  MessageCircle, ChevronRight, Sparkles, TrendingDown
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Student { id: string; full_name: string; grade_level: string; major: string; phone: string | null; hasDrop?: boolean; }
interface Exam { student_id: string; total_net: number; created_at: string; }

export default function CoachPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const supabase = createClient();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const { data: sData } = await supabase.from('students').select('*').eq('coach_id', user.id).order('full_name', { ascending: true });
      const currentStudents = (sData as Student[]) || [];

      if (currentStudents.length > 0) {
        const { data: eData } = await supabase.from('exams').select('student_id, total_net, created_at').in('student_id', currentStudents.map(s => s.id)).order('created_at', { ascending: true });
        const exams = (eData as Exam[]) || [];
        setAllExams(exams);
        setStudents(currentStudents.map(s => {
          const sEx = exams.filter(e => e.student_id === s.id);
          const drop = sEx.length >= 2 && Number(sEx[sEx.length - 1].total_net) < Number(sEx[sEx.length - 2].total_net);
          return { ...s, hasDrop: drop };
        }));
      } else {
        setStudents([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openWhatsApp = (e: React.MouseEvent, phone: string | null) => {
    e.stopPropagation();
    if (!phone) return toast.error("Numara yok.");
    const clean = phone.replace(/\D/g, '');
    const formatted = clean.startsWith('0') ? `90${clean.substring(1)}` : clean.startsWith('90') ? clean : `90${clean}`;
    window.open(`https://wa.me{formatted}`, '_blank');
  };

  const avgNet = allExams.length > 0 ? (allExams.reduce((a, b) => a + (Number(b.total_net) || 0), 0) / allExams.length).toFixed(1) : "0";
  const criticals = students.filter(s => s.hasDrop).length;
  const filtered = students.filter(s => (s.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-xs uppercase italic">Veriler Alınıyor...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 bg-slate-50 min-h-screen text-slate-900 pb-32">
      <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-6">
           <div className="p-5 bg-slate-900 rounded-[2rem] text-white shadow-xl rotate-3"><LayoutGrid size={32} /></div>
           <div className="text-left">
              <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Koç Paneli</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1 italic opacity-70">Akademik Yönetim Merkezi</p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <input type="text" placeholder="Öğrenci ara..." className="w-full sm:w-80 px-8 h-16 bg-slate-50 border-none rounded-[1.5rem] font-bold text-sm shadow-inner outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <Button className="bg-blue-600 hover:bg-slate-900 rounded-[1.5rem] font-black px-10 h-16 text-white uppercase tracking-widest text-[11px]"><UserPlus size={20} className="mr-2" /> Yeni Öğrenci</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col items-center justify-center text-center">
            <div className="p-5 bg-blue-50 rounded-[1.2rem] mb-4"><Users className="text-blue-600" size={28} /></div>
            <h4 className="text-4xl font-black italic text-slate-900 leading-none">{students.length}</h4>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mt-2">Öğrenciler</p>
        </Card>
        <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col items-center justify-center text-center">
            <div className="p-5 bg-amber-50 rounded-[1.2rem] mb-4"><Zap className="text-amber-500" size={28} /></div>
            <h4 className="text-4xl font-black italic text-slate-900 leading-none">{avgNet}</h4>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mt-2">Ort. Net</p>
        </Card>
        <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col items-center justify-center text-center">
            <div className="p-5 bg-red-50 rounded-[1.2rem] mb-4"><AlertTriangle className="text-red-500" size={28} /></div>
            <h4 className="text-4xl font-black italic text-slate-900 leading-none">{criticals}</h4>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mt-2">Kritik Durum</p>
            <p className="text-[8px] font-bold text-red-400 uppercase mt-1 italic">Neti düşenler</p>
        </Card>
        <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col items-center justify-center text-center">
            <div className="p-5 bg-purple-50 rounded-[1.2rem] mb-4"><Sparkles className="text-purple-600" size={28} /></div>
            <h4 className="text-4xl font-black italic text-slate-900 leading-none">Aktif</h4>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mt-2">Sistem</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((s) => (
          <Card key={s.id} onClick={() => router.push(`/coach/student/${s.id}`)} className="relative bg-white border-none shadow-sm rounded-[2rem] hover:shadow-2xl transition-all duration-500 overflow-hidden group cursor-pointer border border-transparent hover:border-blue-50">
             <div className={`h-1.5 w-full ${s.hasDrop ? 'bg-red-500 animate-pulse' : (["11", "12"].includes(s.grade_level) ? 'bg-blue-600' : 'bg-orange-500')}`} />
             <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-lg border border-slate-100">{s.full_name.charAt(0)}</div>
                    <div>
                      <div className="flex items-center gap-2"><h3 className="text-lg font-black italic text-slate-900 leading-tight">{s.full_name}</h3>{s.hasDrop && <TrendingDown size={16} className="text-red-500" />}</div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.grade_level}. Sınıf • {s.major}</p>
                    </div>
                  </div>
                  <Button onClick={(e) => openWhatsApp(e, s.phone)} className="w-10 h-10 rounded-xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all p-0 shadow-sm border-none"><MessageCircle size={18} /></Button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                   <span className={`text-[9px] font-black uppercase tracking-tighter italic ${s.hasDrop ? 'text-red-500' : 'text-slate-300'}`}>{s.hasDrop ? '⚠️ KRİTİK DÜŞÜŞ' : 'Gelişimi İzle'}</span>
                   <div className="flex items-center text-blue-600 font-black text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">İncele <ChevronRight size={14} className="ml-1" /></div>
                </div>
             </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
