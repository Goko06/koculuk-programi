'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { 
  BookOpen, ArrowLeft, Search, TrendingUp, 
  MessageSquare, Clock, CheckCircle2, XCircle,
  Calendar, Target
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DailyEntry {
  id: string;
  student_id: string;
  entry_date: string;
  total_duration_minutes: number;
  mood: string;
  notes: string;
  subjects_data: any; // JSON içerik: { studies: [], book: {} }
  profiles: { full_name: string, class_level: string, branch: string };
}

export default function CoachDailyTrackingPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  const fetchAllDailyEntries = useCallback(async () => {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      // 1. Koça bağlı öğrencileri al
      const { data: students } = await supabase
        .from('profiles')
        .select('id')
        .eq('coach_id', authData.user.id);

      if (!students || students.length === 0) return;

      const studentIds = students.map(s => s.id);

      // 2. Bu öğrencilerin daily_entries verilerini profil bilgisiyle çek
      const { data, error } = await supabase
        .from('daily_entries')
        .select(`
          *,
          profiles:student_id (
            full_name,
            class_level,
            branch
          )
        `)
        .in('student_id', studentIds)
        .order('entry_date', { ascending: false });

      if (error) throw error;

      // JSON verisini işleme
      const processed = (data || []).map(entry => {
        let sData = entry.subjects_data;
        if (typeof sData === 'string') {
          try { sData = JSON.parse(sData); } catch { sData = { studies: [], book: {} }; }
        }
        return { ...entry, subjects_data: sData || { studies: [], book: {} } };
      });

      setEntries(processed);
    } catch (e) {
      console.error("Veri çekme hatası:", e);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchAllDailyEntries(); }, [fetchAllDailyEntries]);

  const filtered = entries.filter(e => 
    e.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse uppercase italic text-xs tracking-[0.3em]">ANALİZ EDİLİYOR...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 bg-slate-50 min-h-screen text-slate-900 pb-32">
      
      {/* Üst Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-6">
          <Link href="/coach" className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg rotate-[-3deg] hover:rotate-0">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">GÜNLÜK ANALİZ</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1 italic">Tüm Öğrenci Girişleri</p>
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Öğrenci ara..." 
            className="w-full pl-14 pr-6 h-14 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-blue-500/10 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Giriş Listesi */}
      <div className="grid gap-8">
        {filtered.map((entry) => {
          const { studies = [], book = {} } = entry.subjects_data;
          const totalSolved = studies.reduce((acc: number, curr: any) => acc + (Number(curr.solved) || 0), 0);
          const totalCorrect = studies.reduce((acc: number, curr: any) => acc + (Number(curr.correct) || 0), 0);
          const accuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

          return (
            <Card key={entry.id} className="p-8 rounded-[3rem] border-none shadow-sm bg-white hover:shadow-2xl transition-all group overflow-hidden relative">
              <div className="flex flex-col xl:flex-row gap-10">
                
                {/* 1. Sol: Öğrenci ve Tarih */}
                <div className="flex items-center gap-5 min-w-[280px]">
                  <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center font-black text-2xl italic shadow-xl group-hover:bg-blue-600 transition-colors rotate-3 group-hover:rotate-0">
                    {entry.profiles?.full_name?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none mb-2">
                      {entry.profiles?.full_name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest italic">{entry.profiles?.class_level}. SINIF</span>
                      <p className="text-[11px] font-black text-blue-600 flex items-center gap-1.5 uppercase italic">
                        <Calendar size={12} /> {new Date(entry.entry_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Orta: Ana İstatistikler */}
                <div className="flex flex-1 justify-around items-center bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100 relative overflow-hidden">
                  <div className="text-center z-10">
                    <p className="text-[8px] font-black text-slate-400 uppercase italic mb-1">TOPLAM SORU</p>
                    <p className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">{totalSolved}</p>
                  </div>
                  <div className="text-center z-10">
                    <p className="text-[8px] font-black text-emerald-500 uppercase italic mb-1">DOĞRULUK</p>
                    <p className="text-4xl font-black text-emerald-600 italic tracking-tighter leading-none">%{accuracy}</p>
                  </div>
                  <div className="text-center z-10">
                    <p className="text-[8px] font-black text-blue-500 uppercase italic mb-1">SÜRE (DK)</p>
                    <p className="text-4xl font-black text-blue-600 italic tracking-tighter leading-none">{entry.total_duration_minutes}</p>
                  </div>
                  {/* Arka plan süsü */}
                  <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none">
                    <TrendingUp size={100} className="rotate-12" />
                  </div>
                </div>

                {/* 3. Sağ: Kitap ve Mood */}
                <div className="min-w-[250px] flex flex-col justify-center gap-4">
                  {book?.name ? (
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3">
                      <BookOpen className="text-amber-600" size={20} />
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-amber-700 uppercase italic leading-none truncate w-32">{book.name}</p>
                        <p className="text-[9px] font-bold text-amber-500 mt-1">{book.pages} Sayfa</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-2xl text-[9px] font-black text-slate-300 uppercase italic tracking-widest text-center border border-dashed">KİTAP OKUNMADI</div>
                  )}
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase italic">MOD: {entry.mood || '😐'}</span>
                    <button 
                      onClick={() => router.push(`/coach/student/${entry.student_id}`)}
                      className="text-[9px] font-black uppercase text-blue-600 hover:text-slate-900 transition-colors tracking-widest border-b-2 border-blue-100"
                    >
                      DETAYI GÖR
                    </button>
                  </div>
                </div>
              </div>

              {/* Ders Kırılımları (Hover veya Küçük Görünüm) */}
              <div className="mt-8 flex flex-wrap gap-2">
                {studies.slice(0, 5).map((s: any, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-900 uppercase italic">{s.subject}</span>
                    <div className="flex gap-2 text-[9px] font-bold">
                      <span className="text-emerald-600">D:{s.correct}</span>
                      <span className="text-rose-500">Y:{s.wrong}</span>
                    </div>
                  </div>
                ))}
                {studies.length > 5 && <span className="text-[9px] font-black text-slate-300 self-center">+{studies.length - 5} DERS DAHA</span>}
              </div>

              {/* Öğrenci Notu */}
              {entry.notes && (
                <div className="mt-6 p-4 bg-slate-50 rounded-2xl border-l-4 border-blue-600 italic">
                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                    <MessageSquare size={12} className="inline mr-2 opacity-50" />
                    "{entry.notes}"
                  </p>
                </div>
              )}
            </Card>
          );
        })}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-black uppercase italic text-xs tracking-[0.3em]">Henüz bir çalışma girişi bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}
