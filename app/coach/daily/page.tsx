'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Zap, BookOpen, Clock, CheckCircle2, XCircle, 
  ArrowLeft, Search, Loader2 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Report { 
  id: string; 
  subject_name: string; 
  total_questions: number; 
  correct_answers: number; 
  wrong_answers: number; 
  study_minutes: number; 
  message: string; 
  mood: string; 
  created_at: string;
  students: { full_name: string, grade_level: string };
}

export default function CoachDailyPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const { data: sData } = await supabase.from('students').select('id').eq('coach_id', authData.user.id);
      if (sData && sData.length > 0) {
        const sIds = sData.map(s => s.id);
        const { data } = await supabase
          .from('daily_reports')
          .select('*, students(full_name, grade_level)')
          .in('student_id', sIds)
          .order('created_at', { ascending: false });
        
        setReports((data as any) || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const filtered = reports.filter(r => 
    r.students?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.subject_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="h-screen flex items-center justify-center font-black italic uppercase bg-slate-50 tracking-widest text-slate-900 text-xs">YÜKLENİYOR...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-10 bg-slate-50 min-h-screen text-slate-900 pb-32">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-6 text-left">
          <Link href="/coach" className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">GÜNLÜK TAKİP</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1 italic">Öğrenci Çalışma Analizi</p>
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Öğrenci veya ders ara..." 
            className="w-full px-8 h-14 bg-slate-50 border-none rounded-2xl font-bold text-sm shadow-inner outline-none focus:ring-2 ring-blue-100 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-6 top-4 text-slate-300" size={20} />
        </div>
      </div>

      <div className="grid gap-6">
        {filtered.map((r) => (
          <Card key={r.id} className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col lg:flex-row items-center justify-between gap-8 hover:shadow-xl transition-all group">
            
            <div className="flex items-center gap-5 min-w-[250px] text-left">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center font-black text-xl italic uppercase shadow-lg group-hover:bg-blue-600 transition-colors uppercase italic">
                {r.students?.full_name?.charAt(0)}
              </div>
              <div>
                <p className="font-black text-slate-900 text-xl italic uppercase leading-none mb-2 tracking-tighter">{r.students?.full_name}</p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest italic border border-blue-100 flex items-center gap-1.5 shadow-sm uppercase italic">
                    <BookOpen size={12} /> {r.subject_name || "GENEL"}
                  </span>
                  <span className="text-[12px] font-bold italic opacity-40">• {r.mood}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-1 justify-around items-center gap-8 w-full lg:w-auto px-10 border-slate-100 lg:border-x">
              <div className="text-center group-hover:scale-110 transition-transform">
                <p className="text-[9px] font-black text-slate-400 uppercase italic mb-1 tracking-widest">TOPLAM</p>
                <p className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">{r.total_questions}</p>
              </div>
              <div className="text-center group-hover:scale-110 transition-transform">
                <p className="text-[9px] font-black text-emerald-500 uppercase italic mb-1 tracking-widest">DOĞRU</p>
                <p className="text-3xl font-black text-emerald-600 italic tracking-tighter leading-none">{r.correct_answers}</p>
              </div>
              <div className="text-center group-hover:scale-110 transition-transform">
                <p className="text-[9px] font-black text-rose-500 uppercase italic mb-1 tracking-widest">YANLIŞ</p>
                <p className="text-3xl font-black text-rose-600 italic tracking-tighter leading-none">{r.wrong_answers}</p>
              </div>
              <div className="text-center group-hover:scale-110 transition-transform">
                <p className="text-[9px] font-black text-blue-500 uppercase italic mb-1 tracking-widest uppercase italic font-black">DK</p>
                <p className="text-3xl font-black text-blue-600 italic tracking-tighter leading-none">{r.study_minutes}</p>
              </div>
            </div>

            <div className="max-w-[250px] text-right hidden lg:block">
              <p className="text-[10px] font-black text-slate-300 italic mb-2 uppercase tracking-widest">
                {new Date(r.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
              </p>
              <p className="text-xs font-bold text-slate-400 italic leading-relaxed line-clamp-2 italic">"{r.message || "Mesaj yok..."}"</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
