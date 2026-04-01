'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, Users, Loader2, ArrowRight, Search, 
  UserPlus, Eye, EyeOff, GraduationCap, LayoutGrid 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';

const ADMIN_UID = "67e61bdd-3f41-4d93-80ec-214bf816274a"; 

const GRADE_OPTIONS = [
  { value: "5", label: "5. Sınıf" },
  { value: "6", label: "6. Sınıf" },
  { value: "7", label: "7. Sınıf" },
  { value: "8-LGS", label: "8. Sınıf (LGS)" },
  { value: "9", label: "9. Sınıf" },
  { value: "10", label: "10. Sınıf" },
  { value: "11", label: "11. Sınıf" },
  { value: "12-YKS", label: "12. Sınıf (YKS)" },
  { value: "Mezun-YKS", label: "Mezun (YKS)" },
];

export default function CoachDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newStudent, setNewStudent] = useState({
    full_name: '',
    email: '',
    password: '',
    grade_level: '',
  });

  const router = useRouter();
  const supabase = createClient();

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      let query = supabase.from('students').select('*');
      if (user.id !== ADMIN_UID) { 
        query = query.eq('coach_id', user.id); 
      }
      
      const { data, error } = await query.order('full_name', { ascending: true });
      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast.error("Öğrenciler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.grade_level) return toast.error("Lütfen bir sınıf seçin.");
    
    setIsSubmitting(true);
    try {
      // 1. ADIM: Supabase Auth üzerinde kullanıcıyı oluştur (Şifre buraya gider)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newStudent.email,
        password: newStudent.password,
        options: {
          data: {
            full_name: newStudent.full_name,
            role: 'student'
          }
        }
      });

      if (authError) throw authError;

      // 2. ADIM: 'public.students' tablosuna sadece profil bilgilerini ekle
      const { error: dbError } = await supabase.from('students').insert([{
        id: authData.user?.id, // Auth ID ile eşleştiriyoruz
        full_name: newStudent.full_name,
        email: newStudent.email,
        grade_level: newStudent.grade_level,
        coach_id: (await supabase.auth.getUser()).data.user?.id
      }]);

      if (dbError) throw dbError;

      toast.success("Öğrenci kaydı başarıyla tamamlandı.");
      setIsAddModalOpen(false);
      setNewStudent({ full_name: '', email: '', password: '', grade_level: '' });
      fetchStudents();
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-50 text-slate-900">
      
      {/* ÜST PANEL */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
              <LayoutGrid size={28} />
           </div>
           <div>
              <h1 className="text-3xl font-black tracking-tight">Koç Paneli</h1>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 italic">
                 {students.length} Kayıtlı Öğrenci
              </p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Öğrenci Ara..." 
              className="w-full pl-12 pr-4 h-14 bg-slate-100/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setIsAddModalOpen(true)} 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 rounded-2xl gap-3 font-black px-8 h-14 text-white shadow-xl shadow-blue-100"
          >
            <UserPlus size={22} /> Yeni Öğrenci Ekle
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-40">
          <Loader2 className="animate-spin text-blue-600 h-12 w-12" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100">
          <Users className="mx-auto text-slate-100 h-24 w-24 mb-6" />
          <p className="text-slate-400 font-bold italic text-lg text-balance px-4">Henüz bir öğrenci bulunamadı.</p>
        </div>
      ) : (
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
                      <h3 className="font-black text-xl text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{student.full_name}</h3>
                      <p className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 mt-1 inline-block">
                          {student.grade_level}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => router.push(`/coach/student/${student.id}`)} 
                    className="w-full rounded-2xl font-black h-14 bg-slate-900 hover:bg-blue-600 text-white gap-3 text-sm shadow-lg shadow-slate-100 transition-all active:scale-95"
                  >
                    Detayları Gör <ArrowRight size={20} />
                  </Button>
               </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* YENİ ÖĞRENCİ MODALI - SOLID BEYAZ ARKA PLAN */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-none p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.2)] bg-white !opacity-100 z-50">
          <div className="p-10 space-y-6 bg-white w-full relative z-50">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black flex items-center gap-3 tracking-tight text-slate-900">
                  <UserPlus className="text-blue-600" size={32} /> Öğrenci Kaydı
              </DialogTitle>
              <DialogDescription className="font-bold text-slate-400 italic">
                Sisteme yeni öğrenci ve giriş şifresi tanımlayın.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddStudent} className="space-y-5">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-1">Ad Soyad</Label>
                <Input 
                  placeholder="Ahmet Yılmaz" 
                  className="rounded-2xl border-slate-200 h-14 font-bold bg-slate-50 text-slate-900 focus:bg-white"
                  required
                  value={newStudent.full_name}
                  onChange={(e) => setNewStudent({...newStudent, full_name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-1">E-Posta</Label>
                <Input 
                  type="email" 
                  placeholder="ahmet@gmail.com" 
                  className="rounded-2xl border-slate-200 h-14 font-bold bg-slate-50 text-slate-900 focus:bg-white"
                  required
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-600 ml-1">Giriş Şifresi</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 Karakter" 
                    className="rounded-2xl border-blue-100 h-14 font-bold bg-blue-50/50 pr-12 text-slate-900 focus:bg-white"
                    required
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-1">Sınıf Seviyesi</Label>
                <Select onValueChange={(val) => setNewStudent({...newStudent, grade_level: val})} required>
                  <SelectTrigger className="rounded-2xl border-slate-200 h-14 font-bold bg-slate-50 text-slate-900 w-full px-5">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5} className="bg-white border border-slate-200 shadow-2xl rounded-2xl min-w-[200px] w-full p-2 z-[60] !opacity-100">
                    {GRADE_OPTIONS.map((g) => (
                      <SelectItem 
                        key={g.value} 
                        value={g.label} 
                        className="font-bold py-3 text-slate-900 focus:bg-blue-600 focus:text-white cursor-pointer rounded-xl"
                      >
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 h-16 rounded-[1.5rem] font-black text-white text-lg shadow-2xl shadow-blue-100 mt-4"
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Kaydı Tamamla"}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
