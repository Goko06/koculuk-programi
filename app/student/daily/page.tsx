'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SubjectEntry {
  subject: string;
  source: string;
  questions: number;
  correct: number;
  wrong: number;
  blank: number;
  duration: number;
  note: string;
}

export default function DailyEntryPage() {
  const [entries, setEntries] = useState<SubjectEntry[]>([
    { subject: '', source: '', questions: 0, correct: 0, wrong: 0, blank: 0, duration: 0, note: '' }
  ]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [mood, setMood] = useState('😊');
  const [generalNote, setGeneralNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  const subjects = [
    'Türkçe', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji',
    'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü', 'İngilizce',
    'T.C. İnkılap Tarihi', 'Yabancı Dil'
  ];

  const sources = [
    'Palme Soru Bankası', 'Data Yayınları', 'Karekök Yayınları', 'Bilfen Yayınları',
    'Esen Yayınları', 'Tonguç Akademi', 'Final Yayınları', 'Kafa Dengi', 
    'ÖSYM Tarzı Deneme', 'Limit Yayınları', '3D Yayınları', '345 Yayınları',
    'Kendi Ders Notlarım', 'YouTube + Soru Çözümü', 'Hoca Notu', 'Diğer'
  ];

  // Otomatik toplam soru hesaplama
  const updateEntry = (index: number, field: keyof SubjectEntry, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    
    // Otomatik toplam soru hesaplama
    if (['correct', 'wrong', 'blank'].includes(field)) {
      const correct = field === 'correct' ? Number(value) : newEntries[index].correct;
      const wrong = field === 'wrong' ? Number(value) : newEntries[index].wrong;
      const blank = field === 'blank' ? Number(value) : newEntries[index].blank;
      newEntries[index].questions = correct + wrong + blank;
    }
    
    setEntries(newEntries);
  };

  const addSubject = () => {
    setEntries([...entries, { subject: '', source: '', questions: 0, correct: 0, wrong: 0, blank: 0, duration: 0, note: '' }]);
  };

  const removeSubject = (index: number) => {
    if (entries.length === 1) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (entries.some(e => !e.subject || e.questions === 0)) {
      toast.error("Lütfen her ders için ders adı ve çözülen soru sayısını girin.");
      return;
    }

    setIsSaving(true);

    try {
      const testStudentId = "00000000-0000-0000-0000-000000000000";

      const { error } = await supabase
        .from('daily_entries')
        .insert({
          student_id: testStudentId,
          entry_date: new Date().toISOString().split('T')[0],
          total_duration_minutes: totalDuration,
          mood,
          general_note: generalNote,
          subjects_data: entries
        });

      if (error) throw error;

      toast.success("Günlük çalışma başarıyla kaydedildi! 🎉");

      // Formu sıfırla
      setEntries([{ subject: '', source: '', questions: 0, correct: 0, wrong: 0, blank: 0, duration: 0, note: '' }]);
      setTotalDuration(0);
      setGeneralNote('');
      setMood('😊');

    } catch (error: any) {
      toast.error("Kayıt sırasında hata oluştu: " + (error.message || "Bilinmeyen hata"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Günlük Çalışma Girişi</h1>
        <p className="text-slate-600">Bugün yaptığın çalışmaları kaydedelim.</p>
      </div>

      {/* Genel Bilgiler */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Genel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div>
            <Label className="text-sm font-medium">Duygu Durumu</Label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger className="h-12 mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-slate-300 shadow-lg z-50">
                <SelectItem value="😊">😊 Çok İyi</SelectItem>
                <SelectItem value="🙂">🙂 İyi</SelectItem>
                <SelectItem value="😐">😐 Normal</SelectItem>
                <SelectItem value="😕">😕 Biraz Yorgun</SelectItem>
                <SelectItem value="😔">😔 Kötü</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Toplam Çalışma Süresi (dakika)</Label>
            <Input 
              type="number" 
              value={totalDuration}
              onChange={(e) => setTotalDuration(Number(e.target.value))}
              placeholder="180"
              className="h-12 mt-1.5"
            />
          </div>

          <div className="md:col-span-2">
            <Label className="text-sm font-medium">Genel Not</Label>
            <Textarea 
              value={generalNote}
              onChange={(e) => setGeneralNote(e.target.value)}
              placeholder="Bugün nasıl geçti? Zorlandığın konular..."
              rows={3}
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dersler */}
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Dersler</h2>
          <Button onClick={addSubject} variant="outline" className="gap-2">
            <Plus size={18} /> Yeni Ders Ekle
          </Button>
        </div>

        {entries.map((entry, index) => (
          <Card key={index} className="border border-slate-200">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Ders {index + 1}</CardTitle>
                {entries.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeSubject(index)} className="text-red-600">
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium">Ders</Label>
                <Select value={entry.subject} onValueChange={(val) => updateEntry(index, 'subject', val)}>
                  <SelectTrigger className="h-12 mt-1.5">
                    <SelectValue placeholder="Ders seçiniz..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-300 shadow-xl z-[60]">
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s} className="py-2.5">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Kaynak</Label>
                <Select value={entry.source} onValueChange={(val) => updateEntry(index, 'source', val)}>
                  <SelectTrigger className="h-12 mt-1.5">
                    <SelectValue placeholder="Kaynak seçiniz..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-300 shadow-xl z-[60]">
                    {sources.map((s) => (
                      <SelectItem key={s} value={s} className="py-2.5">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Çözülen Soru</Label>
                <Input 
                  type="number" 
                  value={entry.questions}
                  onChange={(e) => updateEntry(index, 'questions', Number(e.target.value))}
                  className="h-12 mt-1.5"
                  placeholder="85"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-emerald-700 text-sm">Doğru</Label>
                  <Input 
                    type="number" 
                    value={entry.correct} 
                    onChange={(e) => updateEntry(index, 'correct', Number(e.target.value))} 
                    className="h-12 mt-1.5" 
                  />
                </div>
                <div>
                  <Label className="text-red-700 text-sm">Yanlış</Label>
                  <Input 
                    type="number" 
                    value={entry.wrong} 
                    onChange={(e) => updateEntry(index, 'wrong', Number(e.target.value))} 
                    className="h-12 mt-1.5" 
                  />
                </div>
                <div>
                  <Label className="text-sm">Boş</Label>
                  <Input 
                    type="number" 
                    value={entry.blank} 
                    onChange={(e) => updateEntry(index, 'blank', Number(e.target.value))} 
                    className="h-12 mt-1.5" 
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Harcanan Süre (dk)</Label>
                <Input 
                  type="number" 
                  value={entry.duration}
                  onChange={(e) => updateEntry(index, 'duration', Number(e.target.value))}
                  className="h-12 mt-1.5"
                  placeholder="90"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium">Ders Notu</Label>
                <Textarea 
                  value={entry.note}
                  onChange={(e) => updateEntry(index, 'note', e.target.value)}
                  placeholder="Bu derste notunuz..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          size="lg" 
          className="px-16 py-6 text-lg font-medium"
        >
          {isSaving ? "Kaydediliyor..." : "Günlük Çalışmayı Kaydet"}
        </Button>
      </div>
    </div>
  );
}