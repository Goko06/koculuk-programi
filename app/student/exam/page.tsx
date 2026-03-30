'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ExamEntryPage() {
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examType, setExamType] = useState('tyt');
  const [totalDuration, setTotalDuration] = useState(0);
  const [source, setSource] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // TYT
  const [turkceDogru, setTurkceDogru] = useState(0);
  const [turkceYanlis, setTurkceYanlis] = useState(0);
  const [matDogru, setMatDogru] = useState(0);
  const [matYanlis, setMatYanlis] = useState(0);
  const [sosyalDogru, setSosyalDogru] = useState(0);
  const [sosyalYanlis, setSosyalYanlis] = useState(0);
  const [fenDogru, setFenDogru] = useState(0);
  const [fenYanlis, setFenYanlis] = useState(0);

  // AYT
  const [edebiyatDogru, setEdebiyatDogru] = useState(0);
  const [edebiyatYanlis, setEdebiyatYanlis] = useState(0);
  const [tarih1Dogru, setTarih1Dogru] = useState(0);
  const [tarih1Yanlis, setTarih1Yanlis] = useState(0);
  const [cografya1Dogru, setCografya1Dogru] = useState(0);
  const [cografya1Yanlis, setCografya1Yanlis] = useState(0);
  const [felsefeDogru, setFelsefeDogru] = useState(0);
  const [felsefeYanlis, setFelsefeYanlis] = useState(0);
  const [matAytDogru, setMatAytDogru] = useState(0);
  const [matAytYanlis, setMatAytYanlis] = useState(0);
  const [fizikDogru, setFizikDogru] = useState(0);
  const [fizikYanlis, setFizikYanlis] = useState(0);
  const [kimyaDogru, setKimyaDogru] = useState(0);
  const [kimyaYanlis, setKimyaYanlis] = useState(0);
  const [biyolojiDogru, setBiyolojiDogru] = useState(0);
  const [biyolojiYanlis, setBiyolojiYanlis] = useState(0);
  const [tarih2Dogru, setTarih2Dogru] = useState(0);
  const [tarih2Yanlis, setTarih2Yanlis] = useState(0);
  const [cografya2Dogru, setCografya2Dogru] = useState(0);
  const [cografya2Yanlis, setCografya2Yanlis] = useState(0);
  const [felsefe2Dogru, setFelsefe2Dogru] = useState(0);
  const [felsefe2Yanlis, setFelsefe2Yanlis] = useState(0);

  const supabase = createClient();

  const calculateNet = (dogru: number, yanlis: number) => {
    return Math.max(0, dogru - yanlis / 4);
  };

  // TYT Netleri
  const tytTurkceNet = calculateNet(turkceDogru, turkceYanlis);
  const tytMatNet = calculateNet(matDogru, matYanlis);
  const tytSosyalNet = calculateNet(sosyalDogru, sosyalYanlis);
  const tytFenNet = calculateNet(fenDogru, fenYanlis);

  // AYT Netleri
  const aytEdebiyatNet = calculateNet(edebiyatDogru, edebiyatYanlis);
  const aytTarih1Net = calculateNet(tarih1Dogru, tarih1Yanlis);
  const aytCografya1Net = calculateNet(cografya1Dogru, cografya1Yanlis);
  const aytFelsefeNet = calculateNet(felsefeDogru, felsefeYanlis);
  const aytMatNet = calculateNet(matAytDogru, matAytYanlis);
  const aytFizikNet = calculateNet(fizikDogru, fizikYanlis);
  const aytKimyaNet = calculateNet(kimyaDogru, kimyaYanlis);
  const aytBiyolojiNet = calculateNet(biyolojiDogru, biyolojiYanlis);
  const aytTarih2Net = calculateNet(tarih2Dogru, tarih2Yanlis);
  const aytCografya2Net = calculateNet(cografya2Dogru, cografya2Yanlis);
  const aytFelsefe2Net = calculateNet(felsefe2Dogru, felsefe2Yanlis);

  const handleSave = async () => {
    if (!examName) {
      toast.error("Deneme adını giriniz.");
      return;
    }

    setIsSaving(true);

    try {
      const testStudentId = "00000000-0000-0000-0000-000000000000";

      const { error } = await supabase
        .from('exams')
        .insert({
          student_id: testStudentId,
          exam_date: examDate,
          exam_name: examName,
          exam_type: examType,
          total_duration_minutes: totalDuration,
          source: source,
          note: note,
          results: {
            tyt: {
              turkce: { dogru: turkceDogru, yanlis: turkceYanlis, net: tytTurkceNet },
              matematik: { dogru: matDogru, yanlis: matYanlis, net: tytMatNet },
              sosyal: { dogru: sosyalDogru, yanlis: sosyalYanlis, net: tytSosyalNet },
              fen: { dogru: fenDogru, yanlis: fenYanlis, net: tytFenNet }
            },
            ayt: {
              edebiyat: { dogru: edebiyatDogru, yanlis: edebiyatYanlis, net: aytEdebiyatNet },
              tarih1: { dogru: tarih1Dogru, yanlis: tarih1Yanlis, net: aytTarih1Net },
              cografya1: { dogru: cografya1Dogru, yanlis: cografya1Yanlis, net: aytCografya1Net },
              felsefe: { dogru: felsefeDogru, yanlis: felsefeYanlis, net: aytFelsefeNet },
              matematik: { dogru: matAytDogru, yanlis: matAytYanlis, net: aytMatNet },
              fizik: { dogru: fizikDogru, yanlis: fizikYanlis, net: aytFizikNet },
              kimya: { dogru: kimyaDogru, yanlis: kimyaYanlis, net: aytKimyaNet },
              biyoloji: { dogru: biyolojiDogru, yanlis: biyolojiYanlis, net: aytBiyolojiNet },
              tarih2: { dogru: tarih2Dogru, yanlis: tarih2Yanlis, net: aytTarih2Net },
              cografya2: { dogru: cografya2Dogru, yanlis: cografya2Yanlis, net: aytCografya2Net },
              felsefe2: { dogru: felsefe2Dogru, yanlis: felsefe2Yanlis, net: aytFelsefe2Net }
            }
          }
        });

      if (error) throw error;

      toast.success("Deneme sonucu başarıyla kaydedildi! 🎉");

      // Form sıfırlama
      setExamName('');
      setTotalDuration(0);
      setSource('');
      setNote('');
      // Tüm inputları sıfırla
      setTurkceDogru(0); setTurkceYanlis(0);
      setMatDogru(0); setMatYanlis(0);
      setSosyalDogru(0); setSosyalYanlis(0);
      setFenDogru(0); setFenYanlis(0);
      setEdebiyatDogru(0); setEdebiyatYanlis(0);
      setTarih1Dogru(0); setTarih1Yanlis(0);
      setCografya1Dogru(0); setCografya1Yanlis(0);
      setFelsefeDogru(0); setFelsefeYanlis(0);
      setMatAytDogru(0); setMatAytYanlis(0);
      setFizikDogru(0); setFizikYanlis(0);
      setKimyaDogru(0); setKimyaYanlis(0);
      setBiyolojiDogru(0); setBiyolojiYanlis(0);
      setTarih2Dogru(0); setTarih2Yanlis(0);
      setCografya2Dogru(0); setCografya2Yanlis(0);
      setFelsefe2Dogru(0); setFelsefe2Yanlis(0);

    } catch (error: any) {
      toast.error("Kayıt sırasında hata oluştu: " + (error.message || "Bilinmeyen hata"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Deneme / Sınav Girişi</h1>
        <p className="text-slate-600">Doğru ve yanlış sayılarını girin, netler otomatik hesaplanacaktır.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deneme Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Deneme Adı</Label>
              <Input 
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Örn: Bilfen TYT Denemesi 12"
                className="h-12 mt-1.5"
              />
            </div>

            <div>
              <Label>Tarih</Label>
              <Input 
                type="date" 
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="h-12 mt-1.5"
              />
            </div>

            <div>
              <Label>Deneme Türü</Label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger className="h-12 mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-300 shadow-xl z-[60]">
                  <SelectItem value="tyt">TYT Denemesi</SelectItem>
                  <SelectItem value="ayt">AYT Denemesi</SelectItem>
                  <SelectItem value="general">Genel Deneme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Toplam Süre (dakika)</Label>
              <Input 
                type="number" 
                value={totalDuration}
                onChange={(e) => setTotalDuration(Number(e.target.value))}
                placeholder="135"
                className="h-12 mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>Kaynak / Deneme Kitabı</Label>
            <Input 
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Örn: Bilfen TYT 12"
              className="h-12 mt-1.5"
            />
          </div>

          {/* TYT Bölümü */}
          {examType === 'tyt' && (
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle>TYT Net Hesaplaması</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                {[
                  { label: "Türkçe", dogru: turkceDogru, setDogru: setTurkceDogru, yanlis: turkceYanlis, setYanlis: setTurkceYanlis, net: tytTurkceNet },
                  { label: "Matematik", dogru: matDogru, setDogru: setMatDogru, yanlis: matYanlis, setYanlis: setMatYanlis, net: tytMatNet },
                  { label: "Sosyal Bilimler", dogru: sosyalDogru, setDogru: setSosyalDogru, yanlis: sosyalYanlis, setYanlis: setSosyalYanlis, net: tytSosyalNet },
                  { label: "Fen Bilimleri", dogru: fenDogru, setDogru: setFenDogru, yanlis: fenYanlis, setYanlis: setFenYanlis, net: tytFenNet },
                ].map((bolum, i) => (
                  <div key={i}>
                    <Label className="text-sm font-medium">{bolum.label}</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <Input type="number" placeholder="D" value={bolum.dogru} onChange={(e) => bolum.setDogru(Number(e.target.value))} className="h-10 text-center" />
                      <Input type="number" placeholder="Y" value={bolum.yanlis} onChange={(e) => bolum.setYanlis(Number(e.target.value))} className="h-10 text-center" />
                      <div className="h-10 bg-emerald-100 rounded-lg flex items-center justify-center font-semibold text-emerald-700">
                        {bolum.net.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* AYT Bölümü */}
          {examType === 'ayt' && (
            <Card className="border border-slate-200">
              <CardHeader>
                <CardTitle>AYT Net Hesaplaması (Otomatik)</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4">
                {[
                  { label: "Türk Dili ve Edebiyatı", dogru: edebiyatDogru, setDogru: setEdebiyatDogru, yanlis: edebiyatYanlis, setYanlis: setEdebiyatYanlis, net: aytEdebiyatNet },
                  { label: "Tarih-1", dogru: tarih1Dogru, setDogru: setTarih1Dogru, yanlis: tarih1Yanlis, setYanlis: setTarih1Yanlis, net: aytTarih1Net },
                  { label: "Coğrafya-1", dogru: cografya1Dogru, setDogru: setCografya1Dogru, yanlis: cografya1Yanlis, setYanlis: setCografya1Yanlis, net: aytCografya1Net },
                  { label: "Felsefe Grubu", dogru: felsefeDogru, setDogru: setFelsefeDogru, yanlis: felsefeYanlis, setYanlis: setFelsefeYanlis, net: aytFelsefeNet },
                  { label: "Matematik", dogru: matAytDogru, setDogru: setMatAytDogru, yanlis: matAytYanlis, setYanlis: setMatAytYanlis, net: aytMatNet },
                  { label: "Fizik", dogru: fizikDogru, setDogru: setFizikDogru, yanlis: fizikYanlis, setYanlis: setFizikYanlis, net: aytFizikNet },
                  { label: "Kimya", dogru: kimyaDogru, setDogru: setKimyaDogru, yanlis: kimyaYanlis, setYanlis: setKimyaYanlis, net: aytKimyaNet },
                  { label: "Biyoloji", dogru: biyolojiDogru, setDogru: setBiyolojiDogru, yanlis: biyolojiYanlis, setYanlis: setBiyolojiYanlis, net: aytBiyolojiNet },
                  { label: "Tarih-2", dogru: tarih2Dogru, setDogru: setTarih2Dogru, yanlis: tarih2Yanlis, setYanlis: setTarih2Yanlis, net: aytTarih2Net },
                  { label: "Coğrafya-2", dogru: cografya2Dogru, setDogru: setCografya2Dogru, yanlis: cografya2Yanlis, setYanlis: setCografya2Yanlis, net: aytCografya2Net },
                  { label: "Felsefe-2 / Din", dogru: felsefe2Dogru, setDogru: setFelsefe2Dogru, yanlis: felsefe2Yanlis, setYanlis: setFelsefe2Yanlis, net: aytFelsefe2Net },
                ].map((bolum, i) => (
                  <div key={i}>
                    <Label className="text-sm font-medium">{bolum.label}</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <Input type="number" placeholder="D" value={bolum.dogru} onChange={(e) => bolum.setDogru(Number(e.target.value))} className="h-10 text-center" />
                      <Input type="number" placeholder="Y" value={bolum.yanlis} onChange={(e) => bolum.setYanlis(Number(e.target.value))} className="h-10 text-center" />
                      <div className="h-10 bg-emerald-100 rounded-lg flex items-center justify-center font-semibold text-emerald-700">
                        {bolum.net.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div>
            <Label>Genel Not / Yorum</Label>
            <Textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Denemede dikkat ettiğin veya zorlandığın konular..."
              rows={4}
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-10 flex justify-center">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          size="lg" 
          className="px-16 py-6 text-lg"
        >
          {isSaving ? "Kaydediliyor..." : "Deneme Sonucunu Kaydet"}
        </Button>
      </div>
    </div>
  );
}