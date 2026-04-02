'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, Search, UserPlus, ArrowRight, 
  LayoutGrid, Loader2, BarChart3, Activity,
  FileText // YENİ İKON
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';

export default function CoachDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();
  const router = useRouter();

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('coach_id', user.id)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast.error("Öğrenciler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-4">
           <div className="p-4 bg-slate-900 rounded-[1.5rem] text-white shadow-xl">
              <LayoutGrid size={28} />
           </div>
           <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none mb-1">Koç Paneli</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] italic">Yönetim Merkezi</p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Öğrenci Ara..." 
              className="w-full pl-12 pr-4 h-14 bg-slate-100/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 font-black text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
             <NotificationBell />
             <Button 
               onClick={() => router.push('/coach/add-student')} 
               className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 rounded-2xl gap-3 font-black px-8 h-14 text-white shadow-xl shadow-blue-100 transition-all active:scale-95"
             >
               <UserPlus size={22} /> Öğrenci Ekle
             </Button>
          </div>
        </div>
      </div>

      {/* KARTLAR: BURASI ÜÇLÜ GRID OLDU */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* KART 1: GÜNLÜK AKIŞ */}
         <Card onClick={() => router.push('/coach/daily')} className="bg-white border-none shadow-sm rounded-[2.5rem] p-8 cursor-pointer hover:bg-blue-50/50 transition-all flex items-center gap-6 group">
            <div className="p-5 bg-blue-600 text-white rounded-3xl shadow-lg group-hover:scale-110 transition-transform">
               <Activity size={32} />
            </div>
            <div>
               <h3 className="text-xl font-black text-slate-900 italic leading-none mb-2">Günlük Akış</h3>
               <p className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Aktiviteler</p>
            </div>
         </Card>

         {/* KART 2: GRUP ANALİZİ */}
         <Card onClick={() => router.push('/coach/reports')} className="bg-slate-900 border-none shadow-sm rounded-[2.5rem] p-8 cursor-pointer hover:bg-slate-800 transition-all flex items-center gap-6 group">
            <div className="p-5 bg-white/10 text-blue-400 rounded-3xl group-hover:scale-110 transition-transform">
               <BarChart3 size={32} />
            </div>
            <div>
               <h3 className="text-xl font-black text-white italic leading-none mb-2">Grup Analizi</h3>
               <p className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">İstatistikler</p>
            </div>
         </Card>

         {/* KART 3: KAYNAK PAYLAŞ (YENİ EKLENEN YER) */}
         <Card onClick={() => router.push('/coach/resources')} className="bg-white border-none shadow-sm rounded-[2.5rem] p-8 cursor-pointer hover:bg-blue-50/50 transition-all flex items-center gap-6 group border border-slate-100">
            <div className="p-5 bg-emerald-500 text-white rounded-3xl shadow-lg group-hover:scale-110 transition-transform">
               <FileText size={32} />
            </div>
            <div>
               <h3 className="text-xl font-black text-slate-900 italic leading-none mb-2">Kaynak Paylaş</h3>
               <p className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Dosya & PDF</p>
            </div>
         </Card>
      </div>

      {/* ÖĞRENCİ LİSTESİ */}
      <div className="space-y-6">
         <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2 italic">
            <Users size={20} className="text-blue-600" /> Kayıtlı Öğrenciler ({filteredStudents.length})
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="bg-white border-none shadow-sm rounded-[3rem] hover:shadow-xl transition-all duration-500 overflow-hidden group">
                 <div className="h-3 bg-blue-600" />
                 <CardContent className="p-8">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="w-16 h-16 bg-slate-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center font-black text-2xl uppercase group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {student.full_name?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-slate-900 leading-tight">{student.full_name}</h3>
                        <p className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest mt-1 inline-block italic border border-blue-100">
                            {student.grade_level}
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => router.push(`/coach/student/${student.id}`)} className="w-full rounded-2xl font-black h-14 bg-slate-900 hover:bg-blue-600 text-white gap-3 text-sm transition-all shadow-xl shadow-slate-100">
                      Öğrenciyi Analiz Et <ArrowRight size={20} />
                    </Button>
                 </CardContent>
              </Card>
            ))}
         </div>
      </div>
    </div>
  );
}
