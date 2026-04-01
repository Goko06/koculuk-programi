'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Activity, Clock, BookOpen, ChevronRight, 
  MessageSquare, Loader2, Calendar as CalendarIcon, 
  TrendingUp, Search 
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

export default function CoachDailyFeed() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchDailyActivities = async () => {
  try {
    setLoading(true);
    // İlişki kurulduktan sonra bu sorgu hatasız çalışacaktır
    const { data, error } = await supabase
      .from('daily_entries')
      .select(`
        *,
        students (
          full_name,
          grade_level
        )
      `)
      .order('entry_date', { ascending: false });

    if (error) {
      console.error("Supabase Sorgu Hatası:", error.message);
      return;
    }
    
    setEntries(data || []);
  } catch (error) {
    console.error("Beklenmedik Hata:", error);
  } finally {
    setLoading(false);
  }
};

    fetchDailyActivities();
  }, [supabase]);

  const filteredEntries = entries.filter(entry => 
    entry.students?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600 h-12 w-12" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-slate-900">
            <Activity className="text-blue-600" size={32} /> Günlük Akış
          </h1>
          <p className="text-slate-400 font-bold italic text-sm mt-1">Öğrencilerinin bugünkü aktivitelerini anlık takip et.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Öğrenci ara..." 
            className="w-full pl-12 pr-4 h-14 bg-slate-100/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold text-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* FEED LIST */}
      <div className="space-y-6">
        {filteredEntries.map((entry) => (
          <Card 
            key={entry.id} 
            onClick={() => router.push(`/coach/student/${entry.student_id}`)}
            className="bg-white border-none shadow-sm rounded-[2.5rem] overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-500 hover:scale-[1.01]"
          >
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Sol Taraf: Öğrenci ve Mood */}
                <div className="p-8 md:w-64 bg-slate-50/50 border-r border-slate-100 flex flex-col items-center justify-center text-center">
                  <span className="text-5xl mb-4 drop-shadow-md">{entry.mood || '😐'}</span>
                  <h3 className="font-black text-slate-900 leading-tight">{entry.students?.full_name}</h3>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase mt-2">
                    {entry.students?.grade_level}
                  </span>
                </div>

                {/* Sağ Taraf: İstatistikler */}
                <div className="p-8 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] italic">
                      <CalendarIcon size={14} className="text-blue-600" />
                      {format(new Date(entry.entry_date), 'dd MMMM EEEE', { locale: tr })}
                    </div>
                    <ChevronRight className="text-slate-200 group-hover:text-blue-600 transition-colors" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Odaklanma</p>
                       <p className="text-xl font-black text-slate-900">{entry.total_duration_minutes} dk</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Çözülen Soru</p>
                       <p className="text-xl font-black text-blue-600">
                        {entry.subjects_data?.reduce((acc: any, curr: any) => acc + (Number(curr.solved_questions) || 0), 0)} Soru
                       </p>
                    </div>
                    <div className="hidden sm:block space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ders Sayısı</p>
                       <p className="text-xl font-black text-slate-900">{entry.subjects_data?.length || 0} Branş</p>
                    </div>
                  </div>

                  {entry.general_note && (
                    <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3 items-center">
                       <MessageSquare size={16} className="text-blue-500 shrink-0" />
                       <p className="text-xs font-bold text-blue-900 italic line-clamp-1">"{entry.general_note}"</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
