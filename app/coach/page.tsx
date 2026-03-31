'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, TrendingUp, Clock, Award, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function CoachDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const [newStudent, setNewStudent] = useState({
    full_name: '',
    grade_level: '',
    school_name: '',
    target_university: '',
  });

  const [weeklyProgram, setWeeklyProgram] = useState({
    week_start_date: '',
    total_target_questions: '',
    notes: '',
  });

  const supabase = createClient();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      toast.error("Öğrenciler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.full_name || !newStudent.grade_level) {
      toast.error("Ad soyad ve sınıf seviyesi zorunludur.");
      return;
    }

    try {
      const { error } = await supabase
        .from('students')
        .insert({
          full_name: newStudent.full_name,
          grade_level: newStudent.grade_level,
          school_name: newStudent.school_name,
          target_university: newStudent.target_university,
          tenant_id: '00000000-0000-0000-0000-000000000000',
        });

      if (error) throw error;

      toast.success("Öğrenci başarıyla eklendi!");
      setIsAddStudentModalOpen(false);
      setNewStudent({ full_name: '', grade_level: '', school_name: '', target_university: '' });
      fetchStudents();

    } catch (error: any) {
      toast.error("Öğrenci eklenirken hata oluştu: " + error.message);
    }
  };

  const openProgramModal = (student: any) => {
    setSelectedStudent(student);
    setWeeklyProgram({
      week_start_date: '',
      total_target_questions: '',
      notes: '',
    });
    setIsProgramModalOpen(true);
  };

  const handleAssignProgram = async () => {
    if (!selectedStudent || !weeklyProgram.week_start_date) {
      toast.error("Hafta başlangıç tarihi zorunludur.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.");
        return;
      }

      const { error } = await supabase
        .from('weekly_programs')
        .insert({
          student_id: selectedStudent.id,
          coach_id: user.id,           // ← Burası artık güvenli
          week_start_date: weeklyProgram.week_start_date,
          program_data: {
            total_target_questions: parseInt(weeklyProgram.total_target_questions) || 0,
          },
          notes: weeklyProgram.notes || null,
        });

      if (error) throw error;

      toast.success(`${selectedStudent.full_name} için haftalık program başarıyla atandı!`);
      setIsProgramModalOpen(false);

    } catch (error: any) {
      console.error(error);
      toast.error("Program atanırken hata oluştu: " + error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Koç Paneli</h1>
          <p className="text-slate-600 mt-1">Öğrencilerinizin genel durumuna göz atın.</p>
        </div>

        <Dialog open={isAddStudentModalOpen} onOpenChange={setIsAddStudentModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={20} />
              Yeni Öğrenci Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md z-[110] bg-white">
            <DialogHeader>
              <DialogTitle>Yeni Öğrenci Ekle</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-6">
              <div>
                <Label>Ad Soyad *</Label>
                <Input
                  value={newStudent.full_name}
                  onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                  placeholder="Ahmet Yılmaz"
                  className="h-12"
                />
              </div>

              <div>
                <Label>Sınıf Seviyesi *</Label>
                <Select 
                  value={newStudent.grade_level} 
                  onValueChange={(value) => setNewStudent({ ...newStudent, grade_level: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sınıf seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-[120]">
                    <SelectItem value="5">5. Sınıf</SelectItem>
                    <SelectItem value="6">6. Sınıf</SelectItem>
                    <SelectItem value="7">7. Sınıf</SelectItem>
                    <SelectItem value="8">8. Sınıf (LGS)</SelectItem>
                    <SelectItem value="9">9. Sınıf</SelectItem>
                    <SelectItem value="10">10. Sınıf</SelectItem>
                    <SelectItem value="11">11. Sınıf</SelectItem>
                    <SelectItem value="12">12. Sınıf (YKS)</SelectItem>
                    <SelectItem value="mezun">Mezun / YKS Hazırlık</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Okul Adı</Label>
                <Input
                  value={newStudent.school_name}
                  onChange={(e) => setNewStudent({ ...newStudent, school_name: e.target.value })}
                  placeholder="Örn: Ankara Fen Lisesi"
                  className="h-12"
                />
              </div>

              <div>
                <Label>Hedef Üniversite / Bölüm</Label>
                <Input
                  value={newStudent.target_university}
                  onChange={(e) => setNewStudent({ ...newStudent, target_university: e.target.value })}
                  placeholder="Örn: Hacettepe Tıp"
                  className="h-12"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddStudentModalOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleAddStudent}>
                Öğrenciyi Ekle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Öğrenci</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bu Hafta Aktif</CardTitle>
            <Clock className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">11</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ortalama İlerleme</CardTitle>
            <TrendingUp className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">76%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En İyi Net</CardTitle>
            <Award className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">92</div>
          </CardContent>
        </Card>
      </div>

      {/* Öğrencilerim Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Öğrencilerim ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-12">Yükleniyor...</p>
          ) : students.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-300 rounded-2xl">
              <p className="text-slate-500">Henüz öğrenci eklenmemiş.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <Card key={student.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                        {student.full_name?.charAt(0) || 'Ö'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{student.full_name}</p>
                        <p className="text-sm text-slate-500">
                          {student.grade_level} • {student.school_name || 'Okul belirtilmemiş'}
                        </p>
                        {student.target_university && (
                          <p className="text-xs text-blue-600 mt-1">Hedef: {student.target_university}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Button className="flex-1" variant="outline" size="sm">
                        Detaylar
                      </Button>
                      <Button 
                        className="flex-1" 
                        size="sm"
                        onClick={() => openProgramModal(student)}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Program Atama
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Haftalık Program Atama Modal - Yüksek z-index */}
      <Dialog open={isProgramModalOpen} onOpenChange={setIsProgramModalOpen}>
        <DialogContent className="sm:max-w-lg z-[200] bg-white border shadow-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedStudent ? `${selectedStudent.full_name} için Haftalık Program` : 'Program Atama'}
            </DialogTitle>
            <DialogDescription>
              Bu hafta için hedefleri belirleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div>
              <Label>Hafta Başlangıç Tarihi *</Label>
              <Input
                type="date"
                value={weeklyProgram.week_start_date}
                onChange={(e) => setWeeklyProgram({ ...weeklyProgram, week_start_date: e.target.value })}
                className="h-12"
              />
            </div>

            <div>
              <Label>Haftalık Toplam Hedef Soru Sayısı</Label>
              <Input
                type="number"
                value={weeklyProgram.total_target_questions}
                onChange={(e) => setWeeklyProgram({ ...weeklyProgram, total_target_questions: e.target.value })}
                placeholder="Örn: 1200"
                className="h-12"
              />
            </div>

            <div>
              <Label>Ek Notlar / Özel Talimatlar</Label>
              <Textarea
                value={weeklyProgram.notes}
                onChange={(e) => setWeeklyProgram({ ...weeklyProgram, notes: e.target.value })}
                placeholder="Bu hafta özellikle hangi konulara odaklanılsın?"
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsProgramModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAssignProgram}>
              Programı Ata
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}