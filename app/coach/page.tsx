'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, Search, UserPlus, ArrowRight, 
  LayoutGrid, BarChart3, Activity,
  FileText, X, Phone, AlertTriangle, Zap,
  MessageCircle, Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function CoachDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "", password: "", full_name: "", grade_level: "12", major: "SAY", phone: ""
  });

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

  // WHATSAPP HATA KORUMALI FONKSİYON
  const openWhatsApp = (phone: string | null, studentName: string) => {
    if (!phone) {
      toast.error("Öğrencinin telefon numarası kayıtlı değil!");
      return;
    }
    
    // Numarayı temizle (Hata veren replace satırı burada güvenli hale getirildi)
    const cleanPhone = phone.toString().replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    
    if (cleanPhone.startsWith('0')) formattedPhone = `9${cleanPhone}`;
    else if (cleanPhone.startsWith('5')) formattedPhone = `90${cleanPhone}`;
    
    const message = `Merhaba ${studentName}, çalışmalarını kontrol ettim.`;
    window.open(`https://wa.me{formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch("/api/create-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, coach_id: user?.id }),
      });

      if (res.ok) {
        toast.success("Öğrenci eklendi!");
        setIsModalOpen(false);
        setFormData({ email: "", password: "", full_name: "", grade_level: "12", major: "SAY", phone: "" });
        fetchStudents();
      } else {
        toast.error("Ekleme başarısız.");
      }
    } catch (error) { toast.error("Hata!"); } finally { setAddLoading(false); }
  };

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse uppercase tracking-widest text-xs">Yükleniyor...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 pb-32">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-6">
           <div className="p-5 bg-slate-900 rounded-[1.8rem] text-white shadow-xl rotate-3">
              <LayoutGrid size={32} />
           </div>
           <div className="text-left">
              <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Koç Paneli</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1 italic">Yönetim Merkezi</p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Öğrenci Ara..." 
              className="w-full pl-14 pr-4 h-16 bg-slate-50 border-none rounded-[1.5rem] focus:ring-4 focus:ring-blue-100 font-bold text-sm shadow-inner outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-slate-900 rounded-[1.5rem] gap-3 font-black px-10 h-16 text-white shadow-xl transition-all uppercase tracking-widest text-xs">
            <UserPlus size={22} /> Öğrenci Ekle
          </Button>
        </div>
      </div>

      {/* İSTATİSTİKLER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Öğrenciler", val: students.length, icon: Users, color: "blue", bg: "bg-blue-50" },
          { label: "Aktif Bugün", val: "14", icon: Activity, color: "emerald", bg: "bg-emerald-50" },
          { label: "Soru Sayısı", val: "3.850", icon: Zap, color: "orange", bg: "bg-orange-50" },
          { label: "Kritik", val: "3", icon: AlertTriangle, color: "red", bg: "bg-red-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col items-center justify-center text-center group hover:scale-[1.03] transition-all">
            <div className={`p-4 ${stat.bg} rounded-2xl mb-4 group-hover:rotate-12 transition-transform`}>
               <stat.icon className={`text-${stat.color}-500`} size={24} />
            </div>
            <h4 className="text-3xl font-black italic text-slate-900">{stat.val}</h4>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* ÖĞRENCİ LİSTESİ */}
      <div className="space-y-8">
         <div className="flex items-center justify-between px-6">
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight flex items-center gap-3">
               <Users size={24} className="text-blue-600" /> Öğrencilerim ({filteredStudents.length})
            </h2>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="bg-white border-none shadow-sm rounded-[3.5rem] hover:shadow-2xl transition-all duration-500 overflow-hidden group">
                 <div className={`h-3 ${["5", "6", "7", "8"].includes(student.grade_level) ? 'bg-orange-500' : 'bg-blue-600'}`} />
                 <CardContent className="p-10">
                    <div className="flex items-center gap-5 mb-10 text-left">
                      <div className="w-20 h-20 bg-slate-50 text-slate-900 rounded-[2rem] flex items-center justify-center font-black text-3xl uppercase shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all">
                        {student.full_name?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight uppercase italic">{student.full_name}</h3>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                          {student.grade_level}. Sınıf {student.major && `• ${student.major}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 p-6 rounded-[2rem]">
                       <div className="text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Puan/Net</p>
                          <p className="text-xl font-black text-slate-900 italic">415.2</p>
                       </div>
                       <div className="text-center border-l border-slate-200">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Soru/Hafta</p>
                          <p className="text-xl font-black text-slate-900 italic">850</p>
                       </div>
                    </div>
                    
                    <div className="flex gap-3">
                       <Button 
                        onClick={(e) => { e.stopPropagation(); openWhatsApp(student.phone, student.full_name); }}
                        className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] gap-3 font-black text-[11px] uppercase tracking-widest"
                       >
                         <MessageCircle size={18} /> WhatsApp
                       </Button>
                       <Button 
                        onClick={() => router.push(`/coach/student/${student.id}`)}
                        className="w-14 h-14 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 rounded-[1.5rem] transition-all"
                       >
                         <ArrowRight size={20} />
                       </Button>
                    </div>
                 </CardContent>
              </Card>
            ))}
         </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <Card className="w-full max-w-xl bg-white rounded-[3.5rem] p-10 relative animate-in zoom-in-95">
              <Button onClick={() => setIsModalOpen(false)} className="absolute right-8 top-8 w-12 h-12 bg-slate-50 rounded-full text-slate-400"><X size={24} /></Button>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-8 text-left">Öğrenci Kaydı</h2>
              <form onSubmit={handleAddStudent} className="space-y-5 text-left">
                 <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Tam Adı" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="h-14 rounded-2xl bg-slate-50 px-5 font-bold outline-none" />
                    <input placeholder="Telefon" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="h-14 rounded-2xl bg-slate-50 px-5 font-bold outline-none" />
                 </div>
                 <input placeholder="E-posta" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-14 rounded-2xl bg-slate-50 px-5 font-bold w-full outline-none" />
                 <input type="password" placeholder="Şifre" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="h-14 rounded-2xl bg-slate-50 px-5 font-bold w-full outline-none" />
                 <Button disabled={addLoading} className="w-full h-16 bg-blue-600 rounded-[1.5rem] text-white font-black uppercase tracking-widest shadow-xl">
                   {addLoading ? "Ekleniyor..." : "Kaydı Tamamla"}
                 </Button>
              </form>
           </Card>
        </div>
      )}

    </div>
  );
}
