'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Target, Clock, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function StudentProgramPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Lütfen giriş yapın");
        return;
      }

      const { data, error } = await supabase
        .from('weekly_programs')
        .select(`
          *,
          students!inner(full_name, grade_level)
        `)
        .eq('student_id', user.id)  // Şimdilik student_id ile eşleştiriyoruz (ileride düzeltilecek)
        .order('week_start_date', { ascending: false });

      if (error) throw error;

      setPrograms(data || []);
    } catch (error: any) {
      toast.error("Programlar yüklenirken hata oluştu.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Haftalık Programım</h1>
        <p className="text-slate-600 mt-2">Koçunuz tarafından atanan haftalık hedefler</p>
      </div>

      {loading ? (
        <p>Yükleniyor...</p>
      ) : programs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-medium text-slate-700">Henüz program atanmamış</h3>
            <p className="text-slate-500 mt-2">Koçunuz size haftalık program atadığında burada göreceksiniz.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {programs.map((program) => (
            <Card key={program.id} className="overflow-hidden">
              <CardHeader className="bg-slate-50 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">
                      {format(new Date(program.week_start_date), 'dd MMMM yyyy', { locale: tr })} Haftası
                    </CardTitle>
                    <p className="text-sm text-slate-500">
                      {program.students?.full_name || 'Öğrenci'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-600 font-medium">
                      Hedef: {program.program_data?.total_target_questions || 0} Soru
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Target className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Toplam Hedef</p>
                      <p className="font-semibold text-lg">
                        {program.program_data?.total_target_questions || 0} Soru
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Durum</p>
                      <p className="font-semibold text-lg text-amber-600">Devam Ediyor</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Clock className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Atanma Tarihi</p>
                      <p className="font-semibold">
                        {format(new Date(program.created_at), 'dd MMMM yyyy', { locale: tr })}
                      </p>
                    </div>
                  </div>
                </div>

                {program.notes && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm font-medium text-slate-700 mb-2">Koç Notu:</p>
                    <p className="text-slate-600 italic">"{program.notes}"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}