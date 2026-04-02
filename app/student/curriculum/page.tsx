'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowLeft, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// --- TÜM TÜRKİYE SINAV MÜFREDATI (EKSİKSİZ) ---
const SUBJECTS_POOL = [
  // --- LGS (ORTAOKUL) ---
  { id: 'tur-lgs', name: 'LGS Türkçe', icon: '📝', level: 'LGS', majors: ['LGS'], topics: ['Sözcükte Anlam', 'Cümlede Anlam', 'Paragraf', 'Fiilimsiler', 'Cümlenin Ögeleri', 'Cümle Türleri', 'Yazım Kuralları', 'Noktalama İşaretleri', 'Anlatım Bozuklukları', 'Söz Sanatları', 'Metin Türleri'] },
  { id: 'mat-lgs', name: 'LGS Matematik', icon: '📐', level: 'LGS', majors: ['LGS'], topics: ['Çarpanlar ve Katlar', 'Üslü İfadeler', 'Kareköklü İfadeler', 'Veri Analizi', 'Olasılık', 'Cebirsel İfadeler', 'Doğrusal Denklemler', 'Eşitsizlikler', 'Üçgenler', 'Eşlik ve Benzerlik', 'Dönüşüm Geometrisi', 'Geometrik Cisimler'] },
  { id: 'fen-lgs', name: 'LGS Fen Bilimleri', icon: '🧪', level: 'LGS', majors: ['LGS'], topics: ['Mevsimler ve İklim', 'DNA ve Genetik Kod', 'Basınç', 'Madde ve Endüstri', 'Basit Makineler', 'Enerji Dönüşümleri', 'Elektrik Yükleri'] },
  { id: 'ink-lgs', name: 'LGS İnkılap', icon: '📜', level: 'LGS', majors: ['LGS'], topics: ['Bir Kahraman Doğuyor', 'Milli Uyanış', 'Ya İstiklal Ya Ölüm', 'Atatürkçülük', 'Demokratikleşme Çabaları', 'Dış Politika', 'Atatürk’ün Ölümü'] },
  { id: 'din-lgs', name: 'LGS Din Kültürü', icon: '🌙', level: 'LGS', majors: ['LGS'], topics: ['Kader İnancı', 'Zekat ve Sadaka', 'Din ve Hayat', 'Hz. Muhammed’in Örnekliği', 'Kur’an-ı Kerim'] },
  { id: 'ing-lgs', name: 'LGS İngilizce', icon: '🇬🇧', level: 'LGS', majors: ['LGS'], topics: ['Friendship', 'Teen Life', 'In The Kitchen', 'On The Phone', 'The Internet', 'Adventures', 'Tourism', 'Chores', 'Science', 'Natural Forces'] },

  // --- TYT (TÜM YKS ÖĞRENCİLERİ İÇİN ORTAK) ---
  { id: 'tur-tyt', name: 'TYT Türkçe', icon: '📝', level: 'YKS', majors: ['SAY', 'EA', 'SOZ', 'DIL'], topics: ['Sözcükte Anlam', 'Cümlede Anlam', 'Paragraf', 'Ses Bilgisi', 'Yazım Kuralları', 'Noktalama', 'Sözcük Yapısı', 'İsimler', 'Sıfatlar', 'Zamirler', 'Zarflar', 'Edat-Bağlaç-Ünlem', 'Fiiller', 'Ek Fiil', 'Fiilimsi', 'Cümlenin Ögeleri', 'Anlatım Bozukluğu'] },
  { id: 'mat-tyt', name: 'TYT Matematik', icon: '📐', level: 'YKS', majors: ['SAY', 'EA', 'SOZ', 'DIL'], topics: ['Temel Kavramlar', 'Sayı Basamakları', 'Bölme-Bölünebilme', 'EBOB-EKOK', 'Rasyonel Sayılar', 'Üslü Sayılar', 'Köklü Sayılar', 'Çarpanlara Ayırma', 'Oran-Orantı', 'Denklem Çözme', 'Problemler', 'Kümeler', 'Mantık', 'Fonksiyonlar', 'Polinomlar', 'Veri', 'Permütasyon-Kombinasyon', 'Olasılık'] },
  { id: 'geo-tyt', name: 'Geometri (TYT-AYT)', icon: '📏', level: 'YKS', majors: ['SAY', 'EA', 'SOZ'], topics: ['Doğruda ve Üçgende Açılar', 'Özel Üçgenler', 'Üçgende Benzerlik', 'Üçgende Alan', 'Çokgenler', 'Dörtgenler', 'Çember ve Daire', 'Analitik Geometri', 'Katı Cisimler'] },
  { id: 'fiz-tyt', name: 'TYT Fizik', icon: '⚛️', level: 'YKS', majors: ['SAY', 'EA', 'SOZ', 'DIL'], topics: ['Fizik Bilimine Giriş', 'Madde ve Özellikleri', 'Hareket ve Kuvvet', 'Enerji', 'Isı ve Sıcaklık', 'Basınç ve Kaldırma Kuvveti', 'Elektrostatik', 'Optik', 'Dalgalar'] },
  { id: 'kim-tyt', name: 'TYT Kimya', icon: '🧪', level: 'YKS', majors: ['SAY', 'EA', 'SOZ', 'DIL'], topics: ['Kimya Bilimi', 'Atom ve Periyodik Sistem', 'Etkileşimler', 'Maddenin Halleri', 'Doğa ve Kimya', 'Karışımlar', 'Asit-Baz-Tuz'] },
  { id: 'biy-tyt', name: 'TYT Biyoloji', icon: '🧬', level: 'YKS', majors: ['SAY', 'EA', 'SOZ', 'DIL'], topics: ['Temel Bileşenler', 'Hücre', 'Canlılar Dünyası', 'Hücre Bölünmeleri', 'Kalıtım', 'Ekoloji'] },
  { id: 'tar-tyt', name: 'TYT Tarih', icon: '📜', level: 'YKS', majors: ['SAY', 'EA', 'SOZ', 'DIL'], topics: ['Tarih Bilimi', 'İlk Türk Devletleri', 'İslam Tarihi', 'Osmanlı Tarihi', 'Milli Mücadele', 'İnkılaplar'] },
  { id: 'cog-tyt', name: 'TYT Coğrafya', icon: '🌍', level: 'YKS', majors: ['SAY', 'EA', 'SOZ', 'DIL'], topics: ['Doğa ve İnsan', 'Harita Bilgisi', 'İklim', 'Yerşekilleri', 'Nüfus', 'Bölgeler', 'Afetler'] },

  // --- AYT (BRANŞ BAZLI) ---
  { id: 'mat-ayt', name: 'AYT Matematik', icon: '📊', level: 'YKS', majors: ['SAY', 'EA'], topics: ['Fonksiyonlar', 'II. Dereceden Denklemler', 'Parabol', 'Eşitsizlikler', 'Logaritma', 'Diziler', 'Trigonometri', 'Limit', 'Türev', 'İntegral'] },
  { id: 'fiz-ayt', name: 'AYT Fizik', icon: '🚀', level: 'YKS', majors: ['SAY'], topics: ['Vektörler', 'Tork ve Denge', 'İtme ve Momentum', 'Elektrik ve Manyetizma', 'Çembersel Hareket', 'Atom Fiziği', 'Modern Fizik'] },
  { id: 'kim-ayt', name: 'AYT Kimya', icon: '⚗️', level: 'YKS', majors: ['SAY'], topics: ['Modern Atom Teorisi', 'Gazlar', 'Çözeltiler', 'Enerji ve Hız', 'Kimyasal Denge', 'Organik Kimya'] },
  { id: 'biy-ayt', name: 'AYT Biyoloji', icon: '🔬', level: 'YKS', majors: ['SAY'], topics: ['İnsan Fizyolojisi (Sistemler)', 'Genden Proteine', 'Enerji Dönüşümleri', 'Bitki Biyolojisi'] },
  
  { id: 'edeb-ayt', name: 'AYT Edebiyat', icon: '📚', level: 'YKS', majors: ['EA', 'SOZ'], topics: ['Şiir Bilgisi', 'Edebi Sanatlar', 'Divan Edebiyatı', 'Halk Edebiyatı', 'Tanzimat', 'Milli Edebiyat', 'Cumhuriyet Dönemi'] },
  { id: 'tar2-ayt', name: 'AYT Tarih-2', icon: '📜', level: 'YKS', majors: ['SOZ'], topics: ['İlk Çağ Medeniyetleri', 'Orta Çağ Dünyası', 'Osmanlı Kültür Medeniyet', '20. Yüzyıl Başında Dünya', 'Soğuk Savaş'] },
  { id: 'cog2-ayt', name: 'AYT Coğrafya-2', icon: '🌍', level: 'YKS', majors: ['EA', 'SOZ'], topics: ['Şehirlerin Fonksiyonları', 'Küresel Ticaret', 'Üretim ve Tüketim', 'Çevre Sorunları', 'Sıcak Bölgeler'] },
  { id: 'fel-ayt', name: 'Felsefe Grubu', icon: '🧠', level: 'YKS', majors: ['SOZ'], topics: ['Mantık', 'Psikoloji', 'Sosyoloji', 'Felsefe Tarihi'] }
];

export default function StudentCurriculumPage() {
  const [student, setStudent] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sData } = await supabase.from('students').select('*').eq('id', user.id).single();
      setStudent(sData);

      const isLGS = ["5", "6", "7", "8"].includes(sData?.grade_level || "");
      const major = sData?.major || "SAY";

      // ÖNEMLİ: Alan filtresi ders havuzundan çekilir
      const filtered = SUBJECTS_POOL.filter(sub => isLGS ? sub.level === 'LGS' : sub.majors.includes(major));
      
      setCurriculum(filtered);
      if (filtered.length > 0) setActiveSubjectId(filtered[0].id);

      const { data: cData } = await supabase.from('student_curriculum').select('topic_name').eq('student_id', user.id);
      if (cData) setCompletedTopics(cData.map((t: any) => t.topic_name));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleTopic = async (topicName: string) => {
    try {
      setUpdating(topicName);
      const { data: { user } } = await supabase.auth.getUser();
      const isDone = completedTopics.includes(topicName);

      if (isDone) {
        await supabase.from('student_curriculum').delete().match({ student_id: user?.id, topic_name: topicName });
        setCompletedTopics(prev => prev.filter(t => t !== topicName));
      } else {
        await supabase.from('student_curriculum').insert([{ student_id: user?.id, subject_id: activeSubjectId, topic_name: topicName, is_completed: true }]);
        setCompletedTopics(prev => [...prev, topicName]);
      }
    } catch (error) { toast.error("Hata!"); } finally { setUpdating(null); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-xs uppercase tracking-widest">Müfredat Verileri Senkronize Ediliyor...</div>;

  const currentSubject = curriculum.find(s => s.id === activeSubjectId);
  const progress = Math.round(((currentSubject?.topics.filter((t: string) => completedTopics.includes(t)).length || 0) / (currentSubject?.topics.length || 1)) * 100);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 gap-6 text-left">
        <div className="flex items-center gap-6">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full w-14 h-14 p-0 bg-slate-50 hover:bg-slate-900 hover:text-white transition-all"><ArrowLeft size={28} /></Button>
          <div className="text-left">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-2"><Sparkles className="text-blue-600" /> {student?.major || 'Genel'} Müfredatı</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gelecek Planlaması & Branş Analizi</p>
          </div>
        </div>
        <div className="w-full md:w-64 text-left">
           <p className="text-[10px] font-black uppercase mb-2">Seçili Ders İlerlemesi: %{progress}</p>
           <Progress value={progress} className="h-3" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-3 max-h-screen overflow-y-auto no-scrollbar pb-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2 text-left">Ders Seçimi</p>
          {curriculum.map((s) => (
            <button key={s.id} onClick={() => setActiveSubjectId(s.id)} className={`w-full p-4 rounded-[1.8rem] flex items-center gap-4 transition-all border ${activeSubjectId === s.id ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' : 'bg-white text-slate-500 border-transparent hover:border-slate-200'}`}>
              <span className="text-xl">{s.icon}</span>
              <span className="font-black text-[10px] uppercase tracking-tight text-left leading-tight">{s.name}</span>
            </button>
          ))}
        </div>
        <div className="lg:col-span-3">
          <Card className="rounded-[3rem] border-none shadow-sm bg-white p-8 min-h-[600px] text-left">
            <h2 className="font-black text-2xl uppercase tracking-tighter italic mb-8 flex items-center gap-2"><BookOpen className="text-blue-600" /> {currentSubject?.name} Konuları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentSubject?.topics.map((topic: string, index: number) => {
                const isDone = completedTopics.includes(topic);
                return (
                  <button key={index} disabled={updating === topic} onClick={() => toggleTopic(topic)} className={`p-6 rounded-[2rem] flex items-center justify-between group transition-all border text-left ${isDone ? 'bg-emerald-50 border-emerald-100 text-emerald-900 shadow-inner' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 text-slate-600'}`}>
                    <div className="flex items-center gap-4">
                      {updating === topic ? <Loader2 className="animate-spin text-blue-600" size={24} /> : isDone ? <CheckCircle2 size={24} className="text-emerald-500" /> : <Circle size={24} className="text-slate-200" />}
                      <span className={`text-sm font-bold ${isDone ? 'opacity-60 line-through' : ''}`}>{topic}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
