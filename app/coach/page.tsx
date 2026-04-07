'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, Search, UserPlus, LayoutGrid, Zap, AlertTriangle,
  MessageCircle, ChevronRight, Sparkles, TrendingDown,
  Mail, Phone, Lock, Target, Archive, Trash2, RotateCcw
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
import { isAdminCoach } from '@/lib/roles';

interface Student { 
  id: string; 
  full_name: string; 
  grade_level: string; 
  major: string; 
  phone: string | null; 
  status: 'active' | 'archived' | 'deleted'; // Yeni alan
  hasDrop?: boolean;
  hasActivityToday?: boolean;
}

interface Exam { 
  student_id: string; 
  total_net: number; 
  created_at: string; 
  exam_type: 'LGS' | 'TYT' | 'AYT';
}
interface CoachOption {
  id: string;
  full_name: string;
  status?: 'active' | 'archived' | 'deleted';
}
interface CoachSummary extends CoachOption {
  studentCount: number;
  activeCount: number;
  archivedCount: number;
  deletedCount: number;
}
const supabase = createClient();
export default function CoachPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [coachName, setCoachName] = useState<string>("");
  const [currentCoachId, setCurrentCoachId] = useState<string>("");
  const [isAdminView, setIsAdminView] = useState(false);
  const [coaches, setCoaches] = useState<CoachOption[]>([]);
  const [coachSummaries, setCoachSummaries] = useState<CoachSummary[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState<string>("");
  const [adminTab, setAdminTab] = useState<'students' | 'coaches'>('students');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<'active' | 'archived' | 'deleted'>('active'); // Filtre state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '', classLevel: '', branch: ''
  });
  const [coachForm, setCoachForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [coachLogoFile, setCoachLogoFile] = useState<File | null>(null);
  const [coachLogoPreview, setCoachLogoPreview] = useState<string | null>(null);
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);

  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;
      setCurrentCoachId(user.id);

      const { data: coachProfile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();
      
      const adminMode = isAdminCoach(coachProfile);
      setIsAdminView(adminMode);
      if (coachProfile) setCoachName(coachProfile.full_name);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        router.push("/login");
        return;
      }

      const studentQuery = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name', { ascending: true });

      const { data: sData } = adminMode
        ? await studentQuery
        : await studentQuery.eq('coach_id', user.id);
      
      const currentStudents = (sData as any[]) || [];

      const coachesQuery = supabase
        .from('profiles')
        .select('id, full_name, status')
        .eq('role', 'coach')
        .order('full_name', { ascending: true });
      const { data: coachList } = adminMode
        ? await coachesQuery.eq('coach_id', user.id)
        : await coachesQuery.eq('id', user.id)
      ;
      const safeCoachList = ((coachList as CoachOption[]) || []).filter((c) => c.id !== user.id);
      setCoaches(safeCoachList);
      if (!selectedCoachId) setSelectedCoachId(user.id);

      if (adminMode && safeCoachList.length > 0) {
        const coachIds = safeCoachList.map((c) => c.id);
        const { data: allStudentsForCoaches } = await supabase
          .from('profiles')
          .select('id, coach_id, status')
          .eq('role', 'student')
          .in('coach_id', coachIds);

        const summaryMap = safeCoachList.map((coach) => {
          const studentsOfCoach = (allStudentsForCoaches || []).filter((s) => s.coach_id === coach.id);
          return {
            ...coach,
            studentCount: studentsOfCoach.length,
            activeCount: studentsOfCoach.filter((s) => (s as { status?: string }).status === 'active').length,
            archivedCount: studentsOfCoach.filter((s) => (s as { status?: string }).status === 'archived').length,
            deletedCount: studentsOfCoach.filter((s) => (s as { status?: string }).status === 'deleted').length,
          };
        });
        setCoachSummaries(summaryMap);
      } else {
        setCoachSummaries([]);
      }

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
            status: s.status || 'active',
            hasDrop: drop,
            hasActivityToday: Math.random() > 0.7 
          };
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [supabase, router, selectedCoachId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStudentStatus = async (id: string, newStatus: 'active' | 'archived' | 'deleted') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success("Öğrenci durumu güncellendi.");
      fetchData();
    } catch (err) {
      toast.error("İşlem başarısız oldu.");
    }
  };

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
      const targetCoachId = isAdminView ? selectedCoachId : auth.user?.id;
      if (!targetCoachId) {
        toast.error("Koç seçimi zorunlu.");
        setIsSubmitting(false);
        return;
      }

      const res = await fetch('/api/create-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, coachId: targetCoachId }),
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

  const readFileAsDataURL = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleCreateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      let logoBase64: string | null = null;
      if (coachLogoFile) {
        logoBase64 = await readFileAsDataURL(coachLogoFile);
      }
      const res = await fetch('/api/create-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...coachForm,
          parentAdminId: auth.user?.id,
          logoBase64,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Koç oluşturulamadı');
      toast.success('Alt koç başarıyla eklendi.');
      setCoachForm({ fullName: '', email: '', phone: '', password: '' });
      setCoachLogoFile(null);
      setCoachLogoPreview(null);
      setIsCoachModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Koç oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCoachStatus = async (coachId: string, newStatus: 'active' | 'archived' | 'deleted') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', coachId)
        .eq('role', 'coach');
      if (error) throw error;
      toast.success("Koç durumu güncellendi.");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Koç durumu güncellenemedi.");
    }
  };

  const criticalStudentsList = students.filter(s => s.hasDrop && s.status === 'active');
  const assignableCoaches: CoachOption[] = isAdminView
    ? [
        ...(currentCoachId ? [{ id: currentCoachId, full_name: `${coachName || 'Ana Koç'} (Ben)` }] : []),
        ...[...coaches].sort((a, b) => a.full_name.localeCompare(b.full_name, 'tr')),
      ]
    : [...coaches].sort((a, b) => a.full_name.localeCompare(b.full_name, 'tr'));
  
  // Arama ve Filtreleme (active/archived/deleted)
  const filtered = students.filter(s => 
    s.status === viewMode && 
    (s.full_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-xs uppercase italic">Yükleniyor...</div>;

  return (
    <div className="p-4 md:p-8 max-w-[1500px] mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 pb-32">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div className="flex items-center gap-5 min-w-0">
            <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-lg rotate-3"><LayoutGrid size={28} /></div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase leading-none truncate">
                {coachName || "Koç Paneli"}
              </h1>
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-2 italic">
                {isAdminView ? "Admin Koç Kontrol Merkezi" : "Öğrencilerim"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {isAdminView && (
              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                <button
                  onClick={() => setAdminTab('students')}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${adminTab === 'students' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Öğrencilerim
                </button>
                <button
                  onClick={() => setAdminTab('coaches')}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${adminTab === 'coaches' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Koçlarım
                </button>
              </div>
            )}

            {(!isAdminView || adminTab === 'students') && (
              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                <button onClick={() => setViewMode('active')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'active' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Aktif</button>
                <button onClick={() => setViewMode('archived')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'archived' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}>Arşiv</button>
                <button onClick={() => setViewMode('deleted')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'deleted' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400 hover:text-slate-600'}`}>Silinenler</button>
              </div>
            )}

            {(!isAdminView || adminTab === 'students') && (
              <div className="relative w-full md:w-[22rem]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input type="text" placeholder="Öğrenci ara..." className="w-full pl-12 pr-6 h-12 md:h-14 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-blue-500/20" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          {(!isAdminView || adminTab === 'students') && (
          <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (open) {
                setFormData({ fullName: '', email: '', phone: '', password: '', classLevel: '', branch: '' });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-slate-900 rounded-2xl font-black px-6 h-12 md:h-14 text-white uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 transition-all whitespace-nowrap">
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
                  {isAdminView && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest italic">Atanacak Koç</label>
                      <Select value={selectedCoachId} onValueChange={setSelectedCoachId}>
                        <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
                          <SelectValue placeholder="Koç seçiniz" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border border-slate-100 shadow-2xl bg-white z-[100]">
                          {assignableCoaches.map((coach, index) => (
                            <SelectItem key={coach.id} value={coach.id} className="font-bold py-3">
                              {index === 0 && isAdminView ? `Ana Koç - ${coach.full_name}` : `Alt Koç - ${coach.full_name}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
                      <Input autoComplete="off" placeholder="Telefon" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold" />
                    </div>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <Input autoComplete="new-password" type="password" placeholder="Şifre" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold" />
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
                    {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Kaydı Tamamla <ChevronRight size={18} /></>}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          )}

          {isAdminView && (
            <Dialog
              open={isCoachModalOpen}
              onOpenChange={(open) => {
                setIsCoachModalOpen(open);
                if (!open) {
                  setCoachForm({ fullName: '', email: '', phone: '', password: '' });
                  setCoachLogoFile(null);
                  setCoachLogoPreview(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-slate-900 hover:bg-blue-600 rounded-2xl font-black px-6 h-12 md:h-14 text-white uppercase tracking-widest text-[10px] shadow-lg transition-all whitespace-nowrap">
                  <UserPlus size={18} className="mr-2" /> Alt Koç Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
                <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                  <DialogHeader>
                    <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                      Alt Koç Oluştur
                    </DialogTitle>
                  </DialogHeader>
                </div>
                <form onSubmit={handleCreateCoach} className="p-10 space-y-4">
                  <Input autoComplete="off" placeholder="Ad Soyad" required value={coachForm.fullName} onChange={(e) => setCoachForm({ ...coachForm, fullName: e.target.value })} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
                  <Input autoComplete="off" type="email" placeholder="E-posta" required value={coachForm.email} onChange={(e) => setCoachForm({ ...coachForm, email: e.target.value })} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
                  <Input autoComplete="off" placeholder="Telefon" required value={coachForm.phone} onChange={(e) => setCoachForm({ ...coachForm, phone: e.target.value })} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
                  <Input autoComplete="new-password" type="password" placeholder="Şifre" required value={coachForm.password} onChange={(e) => setCoachForm({ ...coachForm, password: e.target.value })} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Koç Logo (opsiyonel)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setCoachLogoFile(file);
                        setCoachLogoPreview(file ? URL.createObjectURL(file) : null);
                      }}
                      className="block w-full text-sm text-slate-600 file:rounded-2xl file:border-0 file:bg-slate-100 file:px-4 file:py-3 file:text-sm file:font-bold file:text-slate-700"
                    />
                    {coachLogoPreview && (
                      <img src={coachLogoPreview} alt="Logo önizleme" className="h-24 w-24 rounded-2xl border border-slate-200 object-contain mt-2" />
                    )}
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-blue-600 hover:bg-slate-900 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs">
                    {isSubmitting ? "Kaydediliyor..." : "Koçu Oluştur"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          </div>
        </div>
      </div>

      {/* İstatistikler */}
      {(!isAdminView || adminTab === 'students') && (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-slate-100 rounded-xl mb-3 text-slate-600"><Users size={20} /></div>
          <h4 className="text-3xl font-black italic text-slate-900 leading-none">{students.filter(s => s.status === 'active').length}</h4>
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-2">Öğrenciler</p>
        </Card>
        <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white flex flex-col items-center justify-center text-center border-b-4 border-orange-400">
          <div className="p-3 bg-orange-50 rounded-xl mb-3 text-orange-500 font-black text-[10px]">LGS</div>
          <h4 className="text-3xl font-black italic text-slate-900 leading-none">{getAvgByType('LGS')}</h4>
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-2">Ortalama Puan</p>
        </Card>
        <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white flex flex-col items-center justify-center text-center border-b-4 border-blue-500">
          <div className="p-3 bg-blue-50 rounded-xl mb-3 text-blue-600 font-black text-[10px]">TYT</div>
          <h4 className="text-3xl font-black italic text-slate-900 leading-none">{getAvgByType('TYT')}</h4>
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-2">Ortalama Net</p>
        </Card>
        <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white flex flex-col items-center justify-center text-center border-b-4 border-purple-500">
          <div className="p-3 bg-purple-50 rounded-xl mb-3 text-purple-600 font-black text-[10px]">AYT</div>
          <h4 className="text-3xl font-black italic text-slate-900 leading-none">{getAvgByType('AYT')}</h4>
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-2">Ortalama Net</p>
        </Card>
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
      )}

      {/* Öğrenci Listesi */}
      {(!isAdminView || adminTab === 'students') && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((s) => (
          <Card key={s.id} onClick={() => router.push(`/coach/student/${s.id}`)} className="relative bg-white border-none shadow-sm rounded-[2rem] hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden border border-transparent hover:border-blue-100">
            <div className={`h-1.5 w-full ${s.hasDrop ? 'bg-red-500' : 'bg-blue-600'}`} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center font-black text-white">{s.full_name.charAt(0)}</div>
                  <div>
                    <h3 className="text-md font-black italic text-slate-800 leading-tight uppercase">{s.full_name}</h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{s.grade_level}. Sınıf • {s.major}</p>
                  </div>
                </div>
                {/* Aksiyon Grubu */}
                <div className="flex flex-col gap-2">
                   <Button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me{s.phone}`, '_blank'); }} className="w-9 h-9 rounded-xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white p-0 shadow-none border-none"><MessageCircle size={16} /></Button>
                   
                   {/* Arşivleme/Geri Alma */}
                   <Button onClick={(e) => { e.stopPropagation(); updateStudentStatus(s.id, s.status === 'archived' ? 'active' : 'archived'); }} className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white p-0 shadow-none border-none">
                     {s.status === 'archived' ? <RotateCcw size={16} /> : <Archive size={16} />}
                   </Button>

                   {/* Silme/Geri Alma */}
                   <Button onClick={(e) => { e.stopPropagation(); updateStudentStatus(s.id, s.status === 'deleted' ? 'active' : 'deleted'); }} className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-0 shadow-none border-none">
                     {s.status === 'deleted' ? <RotateCcw size={16} /> : <Trash2 size={16} />}
                   </Button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <span className={`text-[8px] font-black uppercase italic ${s.hasDrop ? 'text-red-500' : 'text-slate-300'}`}>{s.hasDrop ? '⚠ TAKİP ET' : 'DURUM İYİ'}</span>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 transition-all" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}
      
      {(!isAdminView || adminTab === 'students') && filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
           <p className="text-slate-400 font-bold uppercase italic text-xs tracking-[0.2em]">Bu bölümde kayıtlı öğrenci bulunamadı.</p>
        </div>
      )}

      {isAdminView && adminTab === 'coaches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {coachSummaries.map((coach) => (
            <Card key={coach.id} className="bg-white border-none shadow-sm rounded-[2rem] p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center font-black text-white">
                  {coach.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-md font-black italic text-slate-800 leading-tight uppercase">{coach.full_name}</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    {(coach.status || 'active') === 'archived' ? 'Arşivde' : (coach.status || 'active') === 'deleted' ? 'Silinmiş' : 'Aktif Koç'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Toplam</p>
                  <p className="text-2xl font-black text-slate-900">{coach.studentCount}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-[8px] font-black uppercase tracking-widest text-blue-400">Aktif</p>
                  <p className="text-2xl font-black text-blue-700">{coach.activeCount}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-[8px] font-black uppercase tracking-widest text-amber-500">Arşiv</p>
                  <p className="text-2xl font-black text-amber-700">{coach.archivedCount}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-[8px] font-black uppercase tracking-widest text-red-400">Silinen</p>
                  <p className="text-2xl font-black text-red-700">{coach.deletedCount}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => updateCoachStatus(coach.id, (coach.status || 'active') === 'archived' ? 'active' : 'archived')}
                  className="flex-1 h-10 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 shadow-none border-none text-[10px] font-black uppercase tracking-wider"
                >
                  {(coach.status || 'active') === 'archived' ? <RotateCcw size={14} className="mr-1" /> : <Archive size={14} className="mr-1" />}
                  {(coach.status || 'active') === 'archived' ? 'Geri Al' : 'Arşivle'}
                </Button>
                <Button
                  onClick={() => updateCoachStatus(coach.id, (coach.status || 'active') === 'deleted' ? 'active' : 'deleted')}
                  className="flex-1 h-10 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 shadow-none border-none text-[10px] font-black uppercase tracking-wider"
                >
                  {(coach.status || 'active') === 'deleted' ? <RotateCcw size={14} className="mr-1" /> : <Trash2 size={14} className="mr-1" />}
                  {(coach.status || 'active') === 'deleted' ? 'Geri Al' : 'Sil'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isAdminView && adminTab === 'coaches' && coachSummaries.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
           <p className="text-slate-400 font-bold uppercase italic text-xs tracking-[0.2em]">Henüz alt koç bulunmuyor.</p>
        </div>
      )}
    </div>
  );
}
