'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Loader2, ArrowRight, Mail, GraduationCap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GRADES } from '@/lib/constants/curriculum';

const ADMIN_UID = "67e61bdd-3f41-4d93-80ec-214bf816274a"; 

export default function CoachDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let query = supabase.from('students').select('*');
      if (user.id !== ADMIN_UID) { query = query.eq('coach_id', user.id); }
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-50 text-slate-900">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold">Koç Paneli</h1>
          <p className="text-slate-500 text-sm font-medium">Öğrenci listesi ve genel durumlar.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2 font-bold px-6 shadow-lg shadow-blue-100 h-11 text-white">
          <Plus size={20} /> Yeni Öğrenci
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 h-10 w-10" /></div>
      ) : students.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">
          <Users className="mx-auto text-slate-200 h-12 w-12 mb-4" />
          <p className="text-slate-400 font-medium">Henüz bir öğrenci eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-slate-900">
          {students.map((student) => (
            <Card key={student.id} className="bg-white border-none shadow-sm rounded-2xl hover:shadow-md transition-all overflow-hidden border border-slate-100">
               <div className="h-2 bg-blue-600" />
               <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl uppercase">
                      {student.full_name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">{student.full_name}</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase mt-0.5">{student.grade_level}. Sınıf</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => router.push(`/coach/student/${student.id}`)} className="flex-1 rounded-xl font-bold h-10 bg-slate-900 hover:bg-black text-white gap-2 text-xs">
                      Analiz & İncele <ArrowRight size={14} />
                    </Button>
                  </div>
               </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
