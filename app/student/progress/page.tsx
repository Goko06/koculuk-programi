'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ProgressPage() {
  const [dailyEntries, setDailyEntries] = useState<any[]>([]);
  const [examEntries, setExamEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Son 10 günlük çalışma
        const { data: daily } = await supabase
          .from('daily_entries')
          .select('*')
          .eq('student_id', user.id)
          .order('entry_date', { ascending: false })
          .limit(10);

        // Son 5 deneme
        const { data: exams } = await supabase
          .from('exams')
          .select('*')
          .eq('student_id', user.id)
          .order('exam_date', { ascending: false })
          .limit(5);

        setDailyEntries(daily || []);
        setExamEntries(exams || []);
      } catch (error) {
        toast.error("Veriler yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-20">Yükleniyor...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">İlerlemem</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Son Günlük Çalışmalar */}
        <Card>
          <CardHeader>
            <CardTitle>Son Günlük Çalışmalar</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyEntries.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">Henüz günlük çalışma kaydı yok.</p>
            ) : (
              <div className="space-y-4">
                {dailyEntries.map((entry, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between">
                      <p className="font-medium">{new Date(entry.entry_date).toLocaleDateString('tr-TR')}</p>
                      <p className="text-sm text-slate-500">{entry.total_duration_minutes} dk</p>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{entry.general_note || "Not yok"}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Son Denemeler */}
        <Card>
          <CardHeader>
            <CardTitle>Son Denemeler</CardTitle>
          </CardHeader>
          <CardContent>
            {examEntries.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">Henüz deneme kaydı yok.</p>
            ) : (
              <div className="space-y-4">
                {examEntries.map((exam, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{exam.exam_name}</p>
                        <p className="text-sm text-slate-500">{new Date(exam.exam_date).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <p className="text-sm font-medium text-blue-600">{exam.exam_type.toUpperCase()}</p>
                    </div>
                    {exam.note && <p className="text-sm text-slate-600 mt-3">{exam.note}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}