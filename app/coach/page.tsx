'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, Search, UserPlus, LayoutGrid, Zap, AlertTriangle,
  MessageCircle, ChevronRight, Sparkles, TrendingDown,
  Mail, Phone, Lock, Target
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

interface Student { 
  id: string; 
  full_name: string; 
  grade_level: string; 
  major: string; 
  phone: string | null; 
  hasDrop?: boolean;
  hasActivityToday?: boolean;
}

interface Exam { 
  student_id: string; 
  total_net: number; 
  created_at: string; 
  exam_type: 'LGS' | 'TYT' | 'AYT'; // Sınav türü ayrımı
}

export default function CoachPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [coachName, setCoachName] = useState<string>("");
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

      const { data: coachProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (coachProfile) setCoachName(coachProfile.full_name);

      const { data: sData } = await supabase.from('profiles').select('*').eq('coach_id', user.id).eq('role', 'student').order('full_name', { ascending: true });
      const currentStudents = (sData as any[]) || [];

      if (currentStudents.length > 0) {
        const { data: eData } = await supabase.from('exams').select('student_id, total_net, created_at, exam_type').in('student_id', currentStudents.map(s => s.id));
        const exams = (eData as Exam[]) || [];
        setAllExams(exams);

        setStudents(currentStudents.map(s => {
          const sEx = exams.filter(e => e.student_id === s.id).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          const drop = sEx.length >= 2 && Number(sEx[sEx.length - 1].total_net) < Number(sEx[sEx.length - 2].total_net);
          
          return { 
            ...s, 
            id: s.id, 
            full_name: s.full_name, 
            grade_level: s.class_level, 
            major: s.branch, 
            phone: s.phone_number, 
            hasDrop: drop,
            hasActivityToday: Math.random() > 0.7 // Simülasyon
          };
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Net Hesaplama Fonksiyonu
  const getAvgByType = (type: string) => {
    const filteredExams = allExams.filter(e => e.exam_type === type);
    if (filteredExams.length === 0) return "0";
    return (filteredExams.reduce((a, b) => a + (Number(b.total_net) || 0), 0) / filteredExams.length).toFixed(1);
  };

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

  const criticalStudentsList = students.filter(s => s.hasDrop);
  const filtered = students.filter(s => (s.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-xs uppercase italic">Yükleniyor...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 pb-32">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-lg rotate-3"><LayoutGrid size={28} /></div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
              {coachName || "Koç Paneli"}
            </h1>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1 italic">Öğrencilerim</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input type="text" placeholder="Öğrenci ara..." className="w-full pl-12 pr-6 h-14 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-blue-500/20" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-slate-900 rounded-2xl font-black px-8 h-14 text-white uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 transition-all">
                <UserPlus size={18} className="mr-2" /> Yeni Öğrenci
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

      {/* İstatistik Kartları Grid (Dinamik Netler Dahil) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Toplam Öğrenci */}
        <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-slate-100 rounded-xl mb-3 text-slate-600"><Users size={20} /></div>
          <h4 className="text-3xl font-black italic text-slate-900 leading-none">{students.length}</h4>
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-2">Öğrenciler</p>
        </Card>

        {/* LGS ORT */}
        <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white flex flex-col items-center justify-center text-center border-b-4 border-orange-400">
          <div className="p-3 bg-orange-50 rounded-xl mb-3 text-orange-500 font-black text-[10px]">LGS</div>
          <h4 className="text-3xl font-black italic text-slate-900 leading-none">{getAvgByType('LGS')}</h4>
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-2">Ortalama Puan</p>
        </Card>

        {/* TYT ORT */}
        <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white flex flex-col items-center justify-center text-center border-b-4 border-blue-500">
          <div className="p-3 bg-blue-50 rounded-xl mb-3 text-blue-600 font-black text-[10px]">TYT</div>
          <h4 className="text-3xl font-black italic text-slate-900 leading-none">{getAvgByType('TYT')}</h4>
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-2">Ortalama Net</p>
        </Card>

        {/* AYT ORT */}
        <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white flex flex-col items-center justify-center text-center border-b-4 border-purple-500">
          <div className="p-3 bg-purple-50 rounded-xl mb-3 text-purple-600 font-black text-[10px]">AYT</div>
          <h4 className="text-3xl font-black italic text-slate-900 leading-none">{getAvgByType('AYT')}</h4>
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-2">Ortalama Net</p>
        </Card>

        {/* Kritik Kartı */}
        <div className="relative group">
          <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white flex flex-col items-center justify-center text-center h-full">
            <div className="p-3 bg-red-50 rounded-xl mb-3 text-red-500"><AlertTriangle size={20} /></div>
            <h4 className="text-3xl font-black italic text-slate-900 leading-none">{criticalStudentsList.length}</h4>
            <p className="text-[8px] font-black uppercase text-red-500 tracking-widest mt-2">Kritik</p>
          </Card>
          {criticalStudentsList.length > 0 && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-56 bg-slate-900 text-white p-5 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50">
              <p className="text-[9px] font-black uppercase text-red-400 mb-2 italic">Düşüşteki Öğrenciler</p>
              {criticalStudentsList.map(s => <div key={s.id} className="text-[11px] font-bold py-1 border-b border-white/5 last:border-0">{s.full_name}</div>)}
            </div>
          )}
        </div>
      </div>

      {/* Öğrenci Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((s) => (
          <Card key={s.id} onClick={() => router.push(`/coach/student/${s.id}`)} className="relative bg-white border-none shadow-sm rounded-[2rem] hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden border border-transparent hover:border-blue-100">
            <div className={`h-1.5 w-full ${s.hasDrop ? 'bg-red-500' : 'bg-blue-600'}`} />
            
            {s.hasActivityToday && (
              <div className="absolute top-6 right-6">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                </span>
              </div>
            )}

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center font-black text-white">{s.full_name.charAt(0)}</div>
                  <div>
                    <h3 className="text-md font-black italic text-slate-800 leading-tight uppercase">{s.full_name}</h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{s.grade_level}. Sınıf • {s.major}</p>
                  </div>
                </div>
                <Button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me{s.phone}`, '_blank'); }} className="w-10 h-10 rounded-xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white p-0 shadow-none border-none"><MessageCircle size={18} /></Button>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <span className={`text-[8px] font-black uppercase italic ${s.hasDrop ? 'text-red-500' : 'text-slate-300'}`}>{s.hasDrop ? '⚠ TAKİP ET' : 'DURUM İYİ'}</span>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 transition-all" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
