'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, Search, UserPlus, LayoutGrid, Zap, AlertTriangle,
  MessageCircle, ChevronRight, Sparkles, TrendingDown,
  Mail, Phone, Lock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '', classLevel: '', branch: ''
  });

  const supabase = createClient();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const { data: sData } = await supabase.from('profiles').select('*').eq('coach_id', user.id).eq('role', 'student').order('full_name', { ascending: true });
      const currentStudents = (sData as any[]) || [];

      if (currentStudents.length > 0) {
        const { data: eData } = await supabase.from('exams').select('student_id, total_net, created_at').in('student_id', currentStudents.map(s => s.id)).order('created_at', { ascending: true });
        const exams = (eData as Exam[]) || [];
        setAllExams(exams);
        setStudents(currentStudents.map(s => {
          const sEx = exams.filter(e => e.student_id === s.id);
          const drop = sEx.length >= 2 && Number(sEx[sEx.length - 1].total_net) < Number(sEx[sEx.length - 2].total_net);
          return { ...s, id: s.id, full_name: s.full_name, grade_level: s.class_level, major: s.branch, phone: s.phone_number, hasDrop: drop };
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

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classLevel) return toast.error("Lütfen sınıf seçin.");
    
    setIsSubmitting(true);
    const { data: auth } = await supabase.auth.getUser();
    
    try {
      const res = await fetch('/api/create-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, coachId: auth.user?.id }),
      });
      const result = await res.json();
      
      if (result.success) {
        toast.success("Öğrenci başarıyla oluşturuldu.");
        setIsModalOpen(false);
        setFormData({ fullName: '', email: '', phone: '', password: '', classLevel: '', branch: '' });
        fetchData();
      } else {
        toast.error(result.error || "Bir hata oluştu.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsApp = (e: React.MouseEvent, phone: string | null) => {
    e.stopPropagation();
    if (!phone) return toast.error("Numara kayıtlı değil.");
    const clean = phone.replace(/\D/g, '');
    const formatted = clean.startsWith('0') ? `90${clean.substring(1)}` : clean.startsWith('90') ? clean : `90${clean}`;
    window.open(`https://wa.me{formatted}`, '_blank');
  };

  const avgNet = allExams.length > 0 ? (allExams.reduce((a, b) => a + (Number(b.total_net) || 0), 0) / allExams.length).toFixed(1) : "0";
  const criticals = students.filter(s => s.hasDrop).length;
  const filtered = students.filter(s => (s.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-xs uppercase italic tracking-widest">Sistem Yükleniyor...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 bg-slate-50 min-h-screen text-slate-900 pb-32">
      
      {/* Header & Arama */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-slate-900 rounded-[2rem] text-white shadow-xl rotate-3"><LayoutGrid size={32} /></div>
          <div className="text-left">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Koç Paneli</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1 italic opacity-70">Öğrenci Yönetimi</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input type="text" placeholder="Öğrenci ara..." className="w-full pl-14 pr-8 h-16 bg-slate-50 border-none rounded-[1.5rem] font-bold text-sm shadow-inner outline-none focus:ring-2 ring-blue-500/20" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-slate-900 rounded-[1.5rem] font-black px-10 h-16 text-white uppercase tracking-widest text-[11px] shadow-lg shadow-blue-200 transition-all active:scale-95">
                <UserPlus size={20} className="mr-2" /> Yeni Öğrenci
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[550px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
              <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12"><UserPlus size={120} /></div>
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                    <Sparkles className="text-blue-400" /> Yeni Kayıt
                  </DialogTitle>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Öğrenci Profilini Oluşturun</p>
                </DialogHeader>
              </div>

              <form onSubmit={handleCreateStudent} className="p-10 space-y-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <Input placeholder="Ad Soyad" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <Input type="email" placeholder="E-posta" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold" />
                    </div>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <Input placeholder="Telefon" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold" />
                    </div>
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <Input type="password" placeholder="Şifre" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest italic">Sınıf</label>
                       <Select onValueChange={val => setFormData({...formData, classLevel: val, branch: (val !== '12' && val !== 'mezun' && val !== '8') ? 'Genel' : (val === '8' ? 'LGS' : formData.branch)})}>
                        <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border border-slate-100 shadow-2xl bg-white z-[100]">
                          {["5", "6", "7", "8", "9", "10", "11", "12", "mezun"].map(c => (
                            <SelectItem key={c} value={c} className="font-bold py-3">{c === 'mezun' ? 'Mezun' : `${c}. Sınıf`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest italic">Branş</label>
                      <Select disabled={!['12', 'mezun'].includes(formData.classLevel)} onValueChange={val => setFormData({...formData, branch: val})}>
                        <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold disabled:opacity-40">
                          <SelectValue placeholder={formData.classLevel === '8' ? 'LGS' : (['12','mezun'].includes(formData.classLevel) ? 'Seçiniz' : 'Genel')} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border border-slate-100 shadow-2xl bg-white z-[100]">
                          {["Sayısal", "Eşit Ağırlık", "Sözel"].map(b => (
                            <SelectItem key={b} value={b} className="font-bold py-3">{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-blue-600 hover:bg-slate-900 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-100 flex items-center justify-center gap-3">
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Kaydı Tamamla <ChevronRight size={18} /></>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* İstatistikler */}
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
          <p className="text-[9px] font-black uppercase text-red-500 tracking-[0.2em] mt-2 font-bold">Kritik</p>
        </Card>
        <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col items-center justify-center text-center">
          <div className="p-5 bg-purple-50 rounded-[1.2rem] mb-4"><Sparkles className="text-purple-600" size={28} /></div>
          <h4 className="text-4xl font-black italic text-slate-900 leading-none">Aktif</h4>
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mt-2">Sistem</p>
        </Card>
      </div>

      {/* Öğrenci Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((s) => (
          <Card key={s.id} onClick={() => router.push(`/coach/student/${s.id}`)} className="relative bg-white border-none shadow-sm rounded-[2rem] hover:shadow-2xl transition-all duration-500 overflow-hidden group cursor-pointer border border-transparent hover:border-blue-100">
            <div className={`h-1.5 w-full ${s.hasDrop ? 'bg-red-500 animate-pulse' : (["11", "12"].includes(s.grade_level) ? 'bg-blue-600' : 'bg-orange-500')}`} />
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg rotate-2 group-hover:rotate-0 transition-transform">{s.full_name.charAt(0)}</div>
                  <div>
                    <div className="flex items-center gap-2"><h3 className="text-lg font-black italic text-slate-900 leading-tight tracking-tighter uppercase">{s.full_name}</h3>{s.hasDrop && <TrendingDown size={16} className="text-red-500" />}</div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.grade_level === 'mezun' ? 'Mezun' : `${s.grade_level}. Sınıf`} • {s.major}</p>
                  </div>
                </div>
                <Button onClick={(e) => openWhatsApp(e, s.phone)} className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all p-0 shadow-sm border-none"><MessageCircle size={20} /></Button>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <span className={`text-[9px] font-black uppercase tracking-tighter italic ${s.hasDrop ? 'text-red-500 font-bold' : 'text-slate-300'}`}>{s.hasDrop ? '⚠ KRİTİK DÜŞÜŞ' : 'Gelişimi İzle'}</span>
                <div className="flex items-center text-blue-600 font-black text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"> Profili Gör <ChevronRight size={14} className="ml-1" /></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
