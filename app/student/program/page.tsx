'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { 
  Calendar, Target, Clock, Loader2, CheckCircle2, Circle, Lock, AlertCircle, BookOpen 
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const GUN_ISIMLERI: Record<string, string> = {
  monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba',
  thursday: 'Perşembe', friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar',
};

export default function StudentProgramPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [solvedCount, setSolvedCount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const supabase = createClient();

  const fetchMyPrograms = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('email', user.email)
        .single();

      const targetId = studentRecord?.id || user.id;

      const { data, error } = await supabase
        .from('weekly_programs')
        .select('*')
        .eq('student_id', targetId)
        .order('week_start_date', { ascending: false });

      if (error) throw error;
      setPrograms(data || []);
    } catch (error: any) {
      toast.error("Veriler alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchMyPrograms(); }, [fetchMyPrograms]);

  const handleCompleteLesson = async () => {
    if (!selectedLesson || !solvedCount) {
      toast.error("Lütfen soru sayısını girin.");
      return;
    }

    try {
      setIsSubmitting(true);
      const { programId, day, lessonIdx } = selectedLesson;
      
      // State'den ilgili programı bul ve derin kopyala
      const currentProgram = programs.find(p => p.id === programId);
      const newProgramData = JSON.parse(JSON.stringify(currentProgram.program_data));
      
      // VERİ SEVİYESİNDE KİLİTLEME
      newProgramData[day][lessonIdx].completed = true;
      newProgramData[day][lessonIdx].solved_questions = parseInt(solvedCount);
      newProgramData[day][lessonIdx].completed_at = new Date().toISOString();

      const { error } = await supabase
        .from('weekly_programs')
        .update({ program_data: newProgramData })
        .eq('id', programId);

      if (error) throw error;

      toast.success("Ders kalıcı olarak kilitlendi!");
      setSelectedLesson(null);
      setSolvedCount('');
      
      // Arayüzü anında güncelle (Sayfa yenilenmesini bekleme)
      setPrograms(prev => prev.map(p => 
        p.id === programId ? { ...p, program_data: newProgramData } : p
      ));

    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return isValid(date) ? format(date, 'dd MMMM yyyy', { locale: tr }) : 'Tarih Yok';
  };

  return (
    <div className="container mx-auto py-8 px-4 text-slate-900">
      <div className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-black">Çalışma Programım</h1>
        <p className="text-slate-500 font-medium italic mt-1">Koçunla senkronize hedefler.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 h-10 w-10" /></div>
      ) : programs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed text-slate-400">Programın henüz hazır değil.</div>
      ) : (
        <div className="space-y-10">
          {programs.map((program) => (
            <Card key={program.id} className="overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white">
              <CardHeader className="bg-slate-50/50 border-b py-6 px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">{formatDate(program.week_start_date)}</CardTitle>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Haftalık Rota</p>
                    </div>
                  </div>
                  <div className="bg-white px-6 py-3 rounded-2xl border shadow-sm flex items-center gap-3">
                    <Target className="text-blue-600" />
                    <span className="text-lg font-black">{program.program_data?.total_target_questions || 0} Soru Hedefi</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-7 divide-y lg:divide-y-0 lg:divide-x border-slate-100">
                  {Object.keys(GUN_ISIMLERI).map((gunKey) => {
                    const gunDersleri = program.program_data?.[gunKey] || [];
                    return (
                      <div key={gunKey} className="bg-white pb-4">
                        <div className="bg-slate-50/80 p-3 text-center border-b font-black text-[10px] text-slate-400 uppercase mb-3">
                          {GUN_ISIMLERI[gunKey]}
                        </div>
                        <div className="px-3 space-y-3">
                          {gunDersleri.map((ders: any, idx: number) => {
                            // KESİN KİLİT KONTROLÜ
                            const isDone = ders.completed === true;
                            
                            return (
                              <div 
                                key={idx} 
                                onClick={() => {
                                  if (isDone) return; // Fonksiyonel Engel
                                  setSelectedLesson({ programId: program.id, day: gunKey, lessonIdx: idx, ...ders });
                                }}
                                className={`w-full p-4 rounded-2xl border transition-all relative ${
                                  isDone 
                                  ? 'bg-emerald-50 border-emerald-200 pointer-events-none' // Mouse ve Tıklama Engeli
                                  : 'bg-white hover:border-blue-400 cursor-pointer shadow-sm hover:shadow-md'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className={`text-[10px] font-bold ${isDone ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    {ders.time}
                                  </span>
                                  {isDone ? (
                                    <div className="bg-emerald-500 p-0.5 rounded-full shadow-sm"><CheckCircle2 size={12} className="text-white" /></div>
                                  ) : (
                                    <Circle size={16} className="text-slate-100 group-hover:text-blue-400 transition-colors" />
                                  )}
                                </div>
                                
                                <h5 className={`text-sm font-bold leading-tight ${isDone ? 'text-emerald-900 line-through decoration-emerald-200' : 'text-slate-800'}`}>
                                  {ders.subject}
                                </h5>
                                
                                {isDone ? (
                                  <div className="mt-3 pt-2 border-t border-emerald-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-emerald-700 uppercase">
                                      {ders.solved_questions} Soru Kaydedildi
                                    </span>
                                    <Lock size={10} className="text-emerald-300" />
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-400 mt-1 truncate">{ders.topic || 'Ders Detayı'}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Kayıt Modalı */}
      <Dialog open={!!selectedLesson} onOpenChange={() => !isSubmitting && setSelectedLesson(null)}>
        <DialogContent className="bg-white rounded-[2.5rem] sm:max-w-md p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Dersi Tamamla</DialogTitle>
            <DialogDescription className="font-bold text-blue-600 uppercase text-xs">
              {selectedLesson?.subject} • {selectedLesson?.time}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-3">
              <Label className="font-bold text-slate-700">Bu ders için kaç soru çözdün?</Label>
              <Input 
                type="number" 
                placeholder="Örn: 40" 
                value={solvedCount} 
                onChange={(e) => setSolvedCount(e.target.value)} 
                className="h-14 bg-slate-50 border-none rounded-2xl text-xl font-bold px-6"
                autoFocus
              />
              <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 uppercase">
                <AlertCircle size={12} /> Dikkat: Kaydettikten sonra düzenleme yapılamaz.
              </p>
            </div>
            <Button 
              disabled={isSubmitting}
              onClick={handleCompleteLesson} 
              className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl text-lg font-bold text-white shadow-xl shadow-blue-100 transition-all active:scale-95"
            >
              {isSubmitting ? "Mühürleniyor..." : "Verileri Kilitle ve Gönder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
