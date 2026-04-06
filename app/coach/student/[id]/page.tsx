'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  History as HistoryIcon, Activity, TrendingUp, Calendar, Target, CheckCircle2,
  Clock, ChevronLeft, Plus, BookOpen, MessageCircle,
  AlertCircle, Sparkles, ClipboardList, Send, Trash2
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

// --- MÜFREDAT HAVUZU ---
const CURRICULUM_POOL: any = {
  "5": {
    "Türkçe": ["Sözcükte Anlam", "Cümlede Anlam", "Parçada Anlam", "Yazım Kuralları", "Noktalama İşaretleri", "Metin Türleri", "Söz Sanatları"],
    "Matematik": ["Doğal Sayılar", "Doğal Sayılarla İşlemler", "Kesirler", "Kesirlerle İşlemler", "Ondalık Gösterim", "Yüzdeler", "Temel Geometrik Kavramlar", "Uzunluk ve Zaman Ölçme", "Veri İşleme", "Alan Ölçme", "Geometrik Cisimler"],
    "Fen Bilimleri": ["Güneş, Dünya ve Ay", "Canlılar Dünyası", "Kuvvetin Ölçülmesi ve Sürtünme", "Madde ve Değişim", "Işığın Yayılması", "İnsan ve Çevre", "Elektrik Devre Elemanları"],
    "Sosyal Bilgiler": ["Birey ve Toplum", "Kültür ve Miras", "İnsanlar, Yerler ve Çevreler", "Bilim, Teknoloji ve Toplum", "Üretim, Dağıtım ve Tüketim", "Etkin Vatandaşlık", "Küresel Bağlantılar"],
    "İngilizce": ["Hello!", "My Town", "Games and Hobbies", "My Daily Routine", "Health", "Movies", "Party Time", "Fitness", "The Animal Shelter", "Festivals"],
    "Din Kültürü": ["Allah İnancı", "Ramazan ve Kurban", "Adap ve Nezaket", "Hz. Muhammed ve Aile Hayatı", "Çevremizde Dinin İzleri"]
  },
  "6": {
    "Türkçe": ["Sözcükte Anlam", "Cümlede Anlam", "Parçada Anlam", "Sözcük Yapısı", "İsimler", "Zamirler", "Sıfatlar", "Edat-Bağlaç-Ünlem", "Yazım-Noktalama"],
    "Matematik": ["Doğal Sayılarla İşlemler", "Çarpanlar ve Katlar", "Kümeler", "Tam Sayılar", "Kesirlerle İşlemler", "Ondalık Gösterim", "Oran", "Cebirsel İfadeler", "Veri Analizi", "Açılar", "Alan Ölçme", "Çember", "Geometrik Cisimler", "Sıvı Ölçme"],
    "Fen Bilimleri": ["Güneş Sistemi ve Tutulmalar", "Vücudumuzdaki Sistemler", "Kuvvet ve Hareket", "Madde ve Isı", "Ses ve Özellikleri", "Vücudumuzdaki Sistemler ve Sağlığı", "Elektriğin İletimi"],
    "Sosyal Bilgiler": ["Biz ve Değerlerimiz", "Tarihe Yolculuk", "Yeryüzünde Yaşam", "Bilim, Teknoloji ve Toplum", "Üretim, Dağıtım ve Tüketim", "Etkin Vatandaşlık", "Uluslararası İlişkiler"],
    "İngilizce": ["Life", "Yummy Breakfast", "Downtown", "Weather and Emotions", "At the Fair", "Vacation", "Occupations", "Detectives at Work", "Saving the Planet", "Democracy"],
    "Din Kültürü": ["Peygamber ve İlahi Kitap İnancı", "Namaz", "Zararlı Alışkanlıklar", "Hz. Muhammed'in Hayatı", "Temel Hak ve Özgürlükler"]
  },
  "7": {
    "Türkçe": ["Fiiller (Anlam, Kip, Kişi)", "Ek Fiil", "Zarflar", "Sözcükte Anlam", "Cümlede Anlam", "Parçada Anlam", "Yazım-Noktalama", "Anlatım Bozuklukları"],
    "Matematik": ["Tam Sayılarla İşlemler", "Rasyonel Sayılar", "Rasyonel Sayılarla İşlemler", "Cebirsel İfadeler", "Eşitlik ve Denklem", "Oran ve Orantı", "Yüzdeler", "Doğrular ve Açılar", "Çokgenler", "Çember ve Daire", "Veri İşleme", "Geometrik Cisimler"],
    "Fen Bilimleri": ["Güneş Sistemi ve Ötesi", "Hücre ve Bölünmeler", "Kuvvet ve Enerji", "Saf Madde ve Karışımlar", "Işığın Madde ile Etkileşimi", "Canlılarda Üreme, Büyüme ve Gelişme", "Elektrik Devreleri"],
    "Sosyal Bilgiler": ["Birey ve Toplum", "Kültür ve Miras", "İnsanlar, Yerler ve Çevreler", "Bilim, Teknoloji ve Toplum", "Üretim, Dağıtım ve Tüketim", "Etkin Vatandaşlık", "Küresel Bağlantılar"],
    "İngilizce": ["Appearance and Personality", "Sports", "Biographies", "Wild Animals", "Television", "Celebrations", "Dreams", "Public Buildings", "Environment", "Planets"],
    "Din Kültürü": ["Melek ve Ahiret İnancı", "Hac ve Kurban", "Ahlaki Davranışlar", "Hz. Muhammed (Allah'ın Elçisi)", "İslam Düşüncesinde Yorumlar"]
  },
  "8": {
    "Türkçe": ["Fiilimsiler", "Cümlenin Ögeleri", "Sözcükte Anlam", "Cümlede Anlam", "Parçada Anlam", "Söz Sanatları", "Yazım Kuralları", "Noktalama İşaretleri", "Metin Türleri", "Anlatım Bozuklukları"],
    "Matematik": ["Çarpanlar ve Katlar", "Üslü İfadeler", "Kareköklü İfadeler", "Veri Analizi", "Olasılık", "Cebirsel İfadeler ve Özdeşlikler", "Doğrusal Denklemler", "Eşitsizlikler", "Üçgenler", "Eşlik ve Benzerlik", "Dönüşüm Geometrisi", "Geometrik Cisimler"],
    "Fen Bilimleri": ["Mevsimler ve İklim", "DNA ve Genetik Kod", "Basınç", "Madde ve Endüstri", "Basit Makineler", "Enerji Dönüşümleri ve Çevre", "Elektrik Yükleri ve Enerji"],
    "İnkılap Tarihi": ["Bir Kahraman Doğuyor", "Milli Uyanış", "Ya İstiklal Ya Ölüm", "Atatürkçülük", "Demokratikleşme Çabaları", "Dış Politika", "Atatürk'ün Ölümü"],
    "İngilizce": ["Friendship", "Teen Life", "In the Kitchen", "On the Phone", "The Internet", "Adventures", "Tourism", "Chores", "Science", "Natural Forces"],
    "Din Kültürü": ["Kader İnancı", "Zekat ve Sadaka", "Din ve Hayat", "Hz. Muhammed'in Örnekliği", "Kur'an-ı Kerim ve Özellikleri"]
  },
  "9": {
    "Edebiyat": ["Edebiyata Giriş", "Hikaye", "Şiir", "Masal/Fabl", "Roman", "Tiyatro", "Biyografi", "Mektup"],
    "Matematik": ["Mantık", "Kümeler", "Denklemler ve Eşitsizlikler", "Üçgenler", "Veri"],
    "Fizik": ["Fizik Bilimine Giriş", "Madde ve Özellikleri", "Hareket ve Kuvvet", "Enerji", "Isı ve Sıcaklık", "Elektrostatik"],
    "Kimya": ["Kimya Bilimi", "Atom ve Periyodik Sistem", "Kimyasal Türler Arası Etkileşimler", "Maddenin Halleri", "Doğa ve Kimya"],
    "Biyoloji": ["Yaşam Bilimi", "Hücre", "Canlılar Dünyası"],
    "Tarih": ["Tarih ve Zaman", "İlk Çağ Medeniyetleri", "Orta Çağ", "İlk Türk Devletleri", "İslam Medeniyeti"],
    "Coğrafya": ["Doğa ve İnsan", "Dünya'nın Şekli ve Hareketleri", "Harita Bilgisi", "Atmosfer ve İklim"]
  },
  "10": {
    "Edebiyat": ["Halk Edebiyatı", "Divan Edebiyatı", "Destan/Efsane", "Roman", "Tiyatro", "Anı", "Haber Metni"],
    "Matematik": ["Sayma ve Olasılık", "Fonksiyonlar", "Polinomlar", "İkinci Dereceden Denklemler", "Çokgenler ve Dörtgenler", "Uzay Geometri"],
    "Fizik": ["Elektrik ve Manyetizma", "Basınç ve Kaldırma Kuvveti", "Dalgalar", "Optik"],
    "Kimya": ["Kimyanın Temel Kanunları", "Karışımlar", "Asit-Baz-Tuz", "Kimya Her Yerde"],
    "Biyoloji": ["Hücre Bölünmeleri", "Kalıtım", "Ekosistem Ekolojisi"],
    "Tarih": ["Selçuklu Tarihi", "Osmanlı Kuruluş ve Yükselme", "Dünya Gücü Osmanlı"],
    "Coğrafya": ["Yer'in İç Yapısı", "Su Kaynakları", "Topraklar", "Bitkiler", "Nüfus"]
  },
  "11": {
    "Edebiyat": ["Edebiyat ve Toplum", "Hikaye", "Şiir", "Makale", "Sohbet", "Roman", "Tiyatro", "Eleştiri"],
    "Matematik": ["Trigonometri", "Analitik Geometri", "Fonksiyon Uygulamaları", "Denklem Sistemleri", "Çember ve Daire", "Uzay Geometri", "Olasılık"],
    "Fizik": ["Kuvvet ve Hareket (Vektörler, Newton)", "Elektrik ve Manyetizma"],
    "Kimya": ["Modern Atom Teorisi", "Gazlar", "Sıvı Çözeltiler", "Enerji", "Hız", "Denge"],
    "Biyoloji": ["İnsan Fizyolojisi (Sistemler)", "Popülasyon Ekolojisi"],
    "Tarih": ["Yeni Çağ Avrupası", "Osmanlı Gerileme ve Reformlar", "Modernleşen Türkiye"],
    "Coğrafya": ["Biyoçeşitlilik", "Ekosistem", "Beşeri Sistemler", "Türkiye Ekonomisi"]
  },
  "TYT_CORE": {
    "Türkçe (TYT)": ["Sözcük Anlamı", "Cümle Anlamı", "Paragraf", "Ses Bilgisi", "Yazım Kuralları", "Noktalama", "Sözcük Yapısı", "Sözcük Türleri", "Cümlenin Ögeleri", "Cümle Türleri", "Anlatım Bozuklukları"],
    "Matematik (TYT)": ["Temel Kavramlar", "Basamak Analizi", "Bölme-Bölünebilme", "EBOB-EKOK", "Rasyonel Sayılar", "Eşitsizlikler", "Mutlak Değer", "Üslü-Köklü Sayılar", "Çarpanlara Ayırma", "Oran-Orantı", "Problemler", "Kümeler", "Fonksiyonlar", "Olasılık", "Polinomlar", "İkinci Dereceden Denklemler"],
    "Geometri (TYT)": ["Doğruda ve Üçgende Açılar", "Üçgenler", "Çokgenler", "Dörtgenler", "Çember ve Daire", "Analitik Geometri", "Katı Cisimler"],
    "Fizik (TYT)": ["Madde ve Özellikleri", "Hareket ve Kuvvet", "Enerji", "Isı ve Sıcaklık", "Elektrostatik", "Basınç ve Kaldırma Kuvveti", "Dalgalar", "Optik"],
    "Kimya (TYT)": ["Kimya Bilimi", "Atom ve Periyodik Sistem", "Kimyasal Türler Arası Etkileşimler", "Maddenin Halleri", "Kimyanın Temel Kanunları", "Karışımlar", "Asit-Baz-Tuz"],
    "Biyoloji (TYT)": ["Yaşam Bilimi", "Hücre", "Canlılar Dünyası", "Hücre Bölünmeleri", "Kalıtım", "Ekoloji"],
    "Tarih (TYT)": ["Tarih ve Zaman", "Türk Tarihi", "İslam Tarihi", "Osmanlı Tarihi", "İnkılap Tarihi"],
    "Coğrafya (TYT)": ["Doğa ve İnsan", "Dünya'nın Şekli", "Harita Bilgisi", "İklim", "İç ve Dış Kuvvetler", "Nüfus", "Bölgeler"],
    "Felsefe (TYT)": ["Felsefeyi Tanıma", "Bilgi-Varlık-Ahlak-Siyaset-Din-Sanat Felsefesi"],
    "Din Kültürü (TYT)": ["İnanç-İbadet-Ahlak", "Peygamberler", "Din ve Hayat"]
  },
  "AYT_SAY": {
    "Matematik (AYT)": ["Trigonometri", "Logaritma", "Diziler", "Limit ve Süreklilik", "Türev", "İntegral"],
    "AYT Geometri": ["Analitik Geometri", "Dönüşüm Geometrisi", "Çemberin Analitiği", "Uzay Geometri (Prizma-Piramit)", "Vektörler", "Trigonometri-2"],
    "Fizik (AYT)": ["Vektörler", "Bağıl Hareket", "Newton Yasaları", "Atışlar", "Enerji ve Momentum", "Tork ve Denge", "Elektriksel Kuvvet", "Manyetizma", "Çembersel Hareket", "Harmonik Hareket", "Modern Fizik"],
    "Kimya (AYT)": ["Modern Atom Teorisi", "Gazlar", "Sıvı Çözeltiler", "Kimyasal Enerji", "Tepkime Hızı", "Kimyasal Denge", "Asit-Baz Dengesi", "Kimya ve Elektrik", "Karbon Kimyasına Giriş", "Organik Bileşikler"],
    "Biyoloji (AYT)": ["Denetleyici Sistemler", "Duyu Organları", "Destek ve Hareket", "Sindirim-Dolaşım-Solunum-Boşaltım", "Genden Proteine", "Canlılarda Enerji Dönüşümü", "Bitki Biyolojisi"]
  },
  "AYT_EA": {
    "Matematik (AYT)": ["Trigonometri", "Logaritma", "Diziler", "Limit-Türev-İntegral"],
    "AYT Geometri": ["Analitik Geometri", "Dönüşüm Geometrisi", "Çemberin Analitiği", "Uzay Geometri (Prizma-Piramit)", "Vektörler", "Trigonometri-2"],
    "Edebiyat (AYT)": ["Şiir Bilgisi", "Edebi Sanatlar", "İslamiyet Öncesi-Halk-Divan Edebiyatı", "Tanzimat-Servet-i Fünun-Milli Edebiyat", "Cumhuriyet Dönemi Türk Edebiyatı", "Yazar-Eser"],
    "Tarih-1 (AYT)": ["Osmanlı Tarihi (Tamam)", "20. Yüzyıl Başlarında Dünya", "I. Dünya Savaşı", "Kurtuluş Savaşı", "Cumhuriyet İnkılapları"],
    "Coğrafya-1 (AYT)": ["Ekosistem", "Nüfus Politikaları", "Türkiye Ekonomisi", "Türkiye'nin Jeopolitiği", "Küresel Ticaret"],
    "Tarih-2 (Sözel)": ["Tarih Bilimine Giriş", "Uygarlığın Doğuşu", "İlk Türk İslam Devletleri", "Osmanlı Kültür ve Medeniyet", "Dünya Gücü Osmanlı", "Arayış Yılları", "En Uzun Yüzyıl", "20. Yüzyıl Başlarında Dünya", "II. Dünya Savaşı", "Soğuk Savaş Dönemi", "Yumuşama Dönemi", "Küreselleşen Dünya"],
    "Coğrafya-2": ["Ekosistemlerin İşleyişi", "Nüfus Politikaları", "Ekonomik Faaliyetler", "Türkiye'nin İşlevsel Bölgeleri", "Küresel Ortam ve Ülkeler", "Çevre ve Toplum"]
  }
};

export default function StudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [student, setStudent] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [dailyEntries, setDailyEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ subject: '', topic: '', targetQuestions: '', dueDate: '' });

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      
      // 1. Profil Verisi
      const { data: sData } = await supabase.from('profiles').select('*').eq('id', id).single();
      setStudent(sData);

      // 2. Diğer Veriler
      const [examsRes, tasksRes, dailyRes] = await Promise.all([
        supabase.from('exams').select('*').eq('student_id', id).order('exam_date', { ascending: false }),
        supabase.from('student_tasks').select('*').eq('student_id', id).order('created_at', { ascending: false }),
        supabase.from('daily_entries').select('*').eq('student_id', id).order('entry_date', { ascending: false })
      ]);

      setExams(examsRes.data || []);
      setTasks(tasksRes.data || []);

      // 3. KRİTİK VERİ İŞLEME (daily_entries)
      const processed = (dailyRes.data || []).map(entry => {
        let sData = entry.subjects_data;
        if (typeof sData === 'string') {
          try { sData = JSON.parse(sData); } catch { sData = { studies: [], book: {} }; }
        }
        return { ...entry, data: sData || { studies: [], book: {} } };
      });
      setDailyEntries(processed);

    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getAvailableCurriculum = () => {
    if (!student) return {};
    const { class_level: level, branch } = student;
    if (["5", "6", "7", "8", "9", "10", "11"].includes(level)) return CURRICULUM_POOL[level] || {};
    if (level === '12' || level === 'mezun') {
      const tyt = CURRICULUM_POOL["TYT_CORE"];
      let ayt = branch === 'Sayısal' ? CURRICULUM_POOL["AYT_SAY"] : branch === 'Eşit Ağırlık' ? CURRICULUM_POOL["AYT_EA"] : {};
      return { ...tyt, ...ayt };
    }
    return {};
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('student_tasks').insert([{
      student_id: id,
      topic_name: `${taskForm.subject} - ${taskForm.topic}`,
      target_questions: parseInt(taskForm.targetQuestions),
      due_date: taskForm.dueDate,
      status: 'pending'
    }]);
    if (error) toast.error("Hata oluştu");
    else { toast.success("Ödev atandı!"); setIsTaskModalOpen(false); setTaskForm({ subject: '', topic: '', targetQuestions: '', dueDate: '' }); fetchData(); }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('student_tasks').delete().eq('id', taskId);
    if (!error) { toast.success("Görev silindi"); fetchData(); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse uppercase italic tracking-widest">Analiz Ediliyor...</div>;

  const currentCurriculum = getAvailableCurriculum();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen pb-20 text-slate-900">
      
      {/* Üst Profil Barı */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-6">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-2xl h-14 w-14 bg-slate-50 hover:bg-slate-900 hover:text-white transition-all">
            <ChevronLeft size={24} />
          </Button>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{student?.full_name}</h1>
            <div className="flex items-center gap-2 mt-2">
               <span className="text-blue-600 font-black text-[10px] uppercase bg-blue-50 px-3 py-1 rounded-full">{student?.class_level}. SINIF</span>
               <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest italic">{student?.branch}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 md:flex-none bg-blue-600 hover:bg-slate-900 text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg">
                <Plus size={18} className="mr-2" /> Yeni Görev Tanımla
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
              <div className="bg-slate-900 p-10 text-white"><DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Görev Ataması</DialogTitle></div>
              <form onSubmit={handleCreateTask} className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Select onValueChange={(val) => setTaskForm({...taskForm, subject: val, topic: ''})}><SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Ders" /></SelectTrigger><SelectContent className="bg-white rounded-xl">{Object.keys(currentCurriculum).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                  <Select disabled={!taskForm.subject} onValueChange={(val) => setTaskForm({...taskForm, topic: val})}><SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Konu" /></SelectTrigger><SelectContent className="bg-white rounded-xl">{taskForm.subject && (currentCurriculum[taskForm.subject] as string[]).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input type="number" placeholder="Soru Hedefi" className="h-14 rounded-2xl bg-slate-50 border-none font-black" onChange={e => setTaskForm({...taskForm, targetQuestions: e.target.value})} />
                  <Input type="date" className="h-14 rounded-2xl bg-slate-50 border-none font-bold" onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
                </div>
                <Button type="submit" className="w-full bg-blue-600 h-14 rounded-2xl font-black uppercase text-xs">Görevi Onayla</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL PANEL: GÖREVLER VE GÜNLÜK ANALİZ */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Haftalık Görevler */}
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white">
            <h2 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-2"><Target className="text-blue-600" /> Haftalık Görevler</h2>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="group flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-blue-100 hover:bg-white transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${task.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                      {task.status === 'completed' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 uppercase italic text-sm">{task.topic_name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Hedef: {task.target_questions} Soru • Teslim: {new Date(task.due_date).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                  <Button onClick={() => deleteTask(task.id)} variant="ghost" className="opacity-0 group-hover:opacity-100 text-red-400"><Trash2 size={20} /></Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Günlük Çalışma Analizi */}
          <Card className="p-8 rounded-[3.5rem] bg-white border-none shadow-sm flex flex-col h-[750px]">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><ClipboardList size={24} /></div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Günlük Çalışma Analizi</h3>
              <span className="ml-auto text-xs font-bold bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full">Son {dailyEntries.length} Gün</span>
            </div>

            <div className="space-y-6 overflow-y-auto pr-3 custom-scrollbar flex-1">
              {dailyEntries.map((entry) => {
                const { studies = [], book = {} } = entry.data;
                const totalSolved = studies.reduce((acc: number, curr: any) => acc + (curr.solved || 0), 0);
                const totalCorrect = studies.reduce((acc: number, curr: any) => acc + (curr.correct || 0), 0);
                const accuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

                return (
                  <div key={entry.id} className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-7 mb-4 hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-sm font-black text-slate-500 flex items-center gap-2"><Calendar size={16} />{new Date(entry.entry_date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        <p className="text-xs text-slate-400 mt-1">{entry.total_duration_minutes} dk • {entry.mood || '😐'}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end text-emerald-600 font-black"><CheckCircle2 size={20} /><span className="text-3xl leading-none">%{accuracy}</span></div>
                        <p className="text-[10px] uppercase font-black text-slate-400">Doğruluk</p>
                      </div>
                    </div>

                    {book?.name && (
                      <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center gap-4">
                        <BookOpen className="w-8 h-8 text-amber-600" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 uppercase text-xs italic line-clamp-1">{book.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold">Yazar: {book.author || '-'}</p>
                        </div>
                        <div className="text-right font-black text-amber-700 leading-none">
                          <span className="text-3xl">{book.pages || 0}</span>
                          <p className="text-[8px] uppercase mt-1">Sayfa</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {studies.map((s: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex-1"><p className="font-black text-slate-900 uppercase text-xs">{s.subject}</p><p className="text-[10px] text-blue-500 font-bold mt-1 uppercase italic">{s.book_name} • {s.duration} dk</p></div>
                          <div className="text-right flex items-center gap-8">
                            <div><p className="text-2xl font-black text-slate-900 leading-none">{s.solved}</p><p className="text-[9px] text-slate-400 uppercase">Soru</p></div>
                            <div className="flex gap-3 text-xs font-bold"><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">D: {s.correct}</span><span className="bg-red-50 text-red-500 px-2 py-1 rounded-md">Y: {s.wrong}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {entry.notes && <div className="mt-6 pt-4 border-t border-slate-200 italic text-xs text-slate-500">"{entry.notes}"</div>}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Deneme Analizleri */}
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white">
             <div className="flex items-center gap-3 mb-8"><div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Sparkles size={20} /></div><h2 className="text-xl font-black italic uppercase tracking-tighter">Deneme Analizleri</h2></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 group">
                    <div><h4 className="font-black text-slate-900 uppercase italic text-sm">{exam.exam_name}</h4><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{new Date(exam.exam_date).toLocaleDateString('tr-TR')} • {exam.exam_type}</p></div>
                    <div className="text-right"><span className="text-2xl font-black italic text-blue-600 leading-none">{exam.total_net}</span><p className="text-[9px] font-black uppercase text-slate-300 mt-1">Net</p></div>
                  </div>
                ))}
             </div>
          </Card>
        </div>

        {/* SAĞ PANEL: ÖZET VE NOTLAR */}
        <div className="space-y-8">
  <Card className="p-8 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
      <TrendingUp size={120} />
    </div>
    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 italic mb-2">Performans</p>
    <h3 className="text-4xl font-black italic uppercase leading-none mb-6">
      {dailyEntries.length > 5 ? 'İstikrarlı' : 'Takipte'}
    </h3>
    
    <div className="space-y-4 relative z-10">
      {/* Ödev Tamamlama */}
      <div className="flex justify-between items-center py-4 border-b border-white/10">
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest italic">Ödev Tamamlama</span>
        <span className="font-black italic text-lg">
          %{tasks.length > 0 ? ((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100).toFixed(0) : 0}
        </span>
      </div>
      
      <div className="space-y-3 py-4 border-b border-white/10">
        {/* KOŞUL: 5, 6, 7 veya 8. Sınıf ise SADECE LGS/NET GÖSTER */}
        {["5", "6", "7", "8"].includes(student?.class_level) ? (
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" /> Net Ortalaması
            </span>
            <span className="font-black italic text-lg text-orange-400">
              {(() => {
                const lgsExams = exams.filter(e => e.exam_type === 'LGS' || e.exam_type === 'DENEME');
                return lgsExams.length > 0 
                  ? (lgsExams.reduce((a, c) => a + Number(c.total_net), 0) / lgsExams.length).toFixed(1) 
                  : "0";
              })()}
            </span>
          </div>
        ) : (
          /* KOŞUL: 9, 10, 11, 12 veya Mezun ise TYT/AYT GÖSTER */
          <>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> TYT Ortalaması
              </span>
              <span className="font-black italic text-lg text-blue-400">
                {(() => {
                  const tytExams = exams.filter(e => e.exam_type === 'TYT');
                  return tytExams.length > 0 
                    ? (tytExams.reduce((a, c) => a + Number(c.total_net), 0) / tytExams.length).toFixed(1) 
                    : "0";
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> AYT Ortalaması
              </span>
              <span className="font-black italic text-lg text-purple-400">
                {(() => {
                  const aytExams = exams.filter(e => e.exam_type === 'AYT');
                  return aytExams.length > 0 
                    ? (aytExams.reduce((a, c) => a + Number(c.total_net), 0) / aytExams.length).toFixed(1) 
                    : "0";
                })()}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  </Card>

  {/* Koçun Değerlendirmesi */}
 <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white border border-slate-100">
  <div className="flex items-center gap-3 mb-6">
    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
      <AlertCircle size={20} />
    </div>
    <h2 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">
      Koçun Değerlendirmesi
    </h2>
  </div>
  
  <textarea 
    id="coachNoteArea"
    className="w-full h-40 bg-slate-50 border-none rounded-3xl p-6 text-sm font-bold placeholder:text-slate-300 outline-none resize-none focus:ring-2 ring-blue-500/20 transition-all" 
    placeholder="Öğrencinin bu haftaki performansı, eksikleri ve motivasyonu hakkında notlar alın..." 
    defaultValue={student?.notes || ""}
  ></textarea>
  
 <Button 
  onClick={async () => { 
    // Textarea'daki güncel notu al
    const noteValue = (document.getElementById('coachNoteArea') as HTMLTextAreaElement).value; 
    
    // id değişkeni, URL'den gelen [id] (yani profil tablosundaki asıl id) olmalı
    const { error } = await supabase
      .from('profiles')
      .update({ notes: noteValue }) 
      .eq('id', id); // Senin tablonun PRIMARY KEY'i 'id'

    if (error) {
      console.error("Güncelleme hatası:", error);
      toast.error("Not kaydedilemedi: " + error.message);
    } else {
      toast.success("Değerlendirme başarıyla kaydedildi! 🚀");
      // Sayfadaki yerel veriyi de güncelle (opsiyonel)
      setStudent({...student, notes: noteValue});
    }
  }} 
  className="w-full mt-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl h-14 font-black uppercase text-[10px] shadow-xl transition-all active:scale-95"
>
  Değerlendirmeyi Kaydet ve Öğrenciye Göster
</Button>
</Card> 
</div>
      </div>
    </div>
  );
}
