'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { 
  FileText, Download, Clock, Search, 
  ArrowLeft, LayoutGrid, Loader2, Sparkles 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function StudentResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchResources = async () => {
  try {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Sadece bu öğrenciye atanan kaynakları getiriyoruz
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        resource_access!inner(student_id)
      `)
      .eq('resource_access.student_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setResources(data || []);
  } catch (error) { 
    console.error("Hata:", error); 
  } finally { 
    setLoading(false); 
  }
};
    fetchResources();
  }, [supabase]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-10 bg-slate-50 min-h-screen text-slate-900 font-sans">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full w-12 h-12 p-0 bg-slate-50"><ArrowLeft size={20} /></Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Koçumdan Kaynaklar</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">Sana Özel Hazırlanan Dökümanlar</p>
          </div>
        </div>
        <div className="p-4 bg-emerald-500 rounded-2xl text-white shadow-xl shadow-emerald-100"><Sparkles size={24} /></div>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
          <FileText size={80} className="mx-auto text-slate-100 mb-6" />
          <h3 className="text-2xl font-black text-slate-300">Henüz bir kaynak paylaşılmadı</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {resources.map((res) => (
             <Card key={res.id} className="rounded-[3rem] border-none shadow-sm bg-white p-8 hover:shadow-2xl transition-all group relative overflow-hidden">
                <div className="relative z-10">
                   <div className="p-5 bg-blue-50 text-blue-600 rounded-[1.5rem] w-fit mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <FileText size={32} />
                   </div>
                   <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight uppercase italic">{res.title}</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-8">
                      <Clock size={12} /> {new Date(res.created_at).toLocaleDateString('tr-TR')} tarihinde gönderildi
                   </p>
                   <a 
                    href={res.file_url} 
                    target="_blank" 
                    className="flex items-center justify-center gap-3 w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
                   >
                     <Download size={18} /> Kaynağı İndir
                   </a>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
             </Card>
           ))}
        </div>
      )}
    </div>
  );
}
