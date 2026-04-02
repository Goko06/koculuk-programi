'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain, Sparkles, ArrowLeft, Users, 
  Search, MessageSquare, Loader2, TrendingUp, TrendingDown 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Student {
  id: string;
  full_name: string;
  grade_level?: string;
  major?: string;
  phone?: string;
  weekly_progress?: number[]; 
}

export default function CoachReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const supabase = createClient();
  const router = useRouter();

  const fetchStudentsWithAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // ÖNEMLİ: Tablo isimlerini 'daily_reports' veya 'reports' olarak deniyoruz
      // Eğer hata alıyorsan Supabase'deki rapor tablonun ismini kontrol etmelisin.
      const { data, error } = await supabase
        .from('students')
        .select(`
          id, full_name, grade_level, major, phone
        `) 
        .eq('coach_id', user.id)
        .order('full_name', { ascending: true });

      if (error) throw error;

      // Grafikleri şimdilik boş dizi olarak başlatıyoruz (Hata almamak için)
      const formattedData = data?.map((student: any) => ({
        ...student,
        weekly_progress: [0, 0, 0, 0, 0, 0, 0] // Gerçek veri çekme mantığı eklenecek
      }));

      setStudents(formattedData || []);
    } catch (error: any) {
      console.error("Veri hatası:", error);
      toast.error("Öğrenci listesi alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchStudentsWithAnalysis(); }, [fetchStudentsWithAnalysis]);

  // Mini Grafik Çizici
  const MiniSparkline = ({ data }: { data: number[] }) => {
    const isUp = data[data.length - 1] >= data[data.length - 2];
    return (
      <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-100">
        <div className="h-10 w-full bg-slate-200/50 rounded-xl animate-pulse flex items-center justify-center text-[10px] font-bold text-slate-400">
           VERİ ANALİZ EDİLİYOR...
        </div>
        <div className={isUp ? 'text-emerald-500' : 'text-rose-500'}>
           {isUp ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-xl"><Users size={24} /></div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter uppercase">Performans Raporları</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Öğrenci Gelişim Takibi</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Öğrenci ara..."
              className="bg-slate-100/50 border-none rounded-2xl py-3 px-6 text-sm font-bold w-full md:w-72"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={() => router.back()} variant="ghost" className="rounded-2xl bg-slate-100 h-12 px-6 font-black"><ArrowLeft size={16} /></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {students
            .filter(s => s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((student) => (
              <Card key={student.id} className="rounded-[3rem] border-none bg-white p-8 shadow-sm hover:shadow-2xl transition-all duration-500">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center font-black text-xl">
                    {student.full_name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">{student.full_name}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{student.grade_level}. Sınıf • {student.major}</p>
                  </div>
                </div>

                <div className="mb-6 space-y-2">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2 text-center italic font-bold">Haftalık Soru Trendi</p>
                   <MiniSparkline data={student.weekly_progress || [0]} />
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => {
                      if (student.phone) {
                        const cleanPhone = student.phone.replace(/\D/g, '');
                        window.open(`https://wa.me{cleanPhone.startsWith('90') ? cleanPhone.slice(2) : cleanPhone}`, '_blank');
                      } else {
                        toast.error("Numara kayıtlı değil!");
                      }
                    }}
                    className="flex-1 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-xs h-14 uppercase"
                  >
                    <MessageSquare size={18} className="mr-2" /> WhatsApp
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="rounded-2xl bg-slate-50 hover:bg-slate-100 h-14 px-6 font-black text-xs uppercase"
                    onClick={() => router.push(`/coach/student/${student.id}`)}
                  >
                    Detay
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
