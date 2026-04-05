'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, TrendingUp, Target, BookOpen, Activity,
  Plus, X, CheckCircle2, Clock, Hash,
  Flame, Timer, Calendar as CalendarIcon, TrendingDown, ChevronRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// --- TÜM MÜFREDAT HAVUZU (EKSİKSİZ) ---
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
    "Fizik (AYT)": ["Vektörler", "Bağıl Hareket", "Newton Yasaları", "Atışlar", "Enerji ve Momentum", "Tork ve Denge", "Elektriksel Kuvvet", "Manyetizma", "Çembersel Hareket", "Harmonik Hareket", "Modern Fizik"],
    "Kimya (AYT)": ["Modern Atom Teorisi", "Gazlar", "Sıvı Çözeltiler", "Kimyasal Enerji", "Tepkime Hızı", "Kimyasal Denge", "Asit-Baz Dengesi", "Kimya ve Elektrik", "Karbon Kimyasına Giriş", "Organik Bileşikler"],
    "Biyoloji (AYT)": ["Denetleyici Sistemler", "Duyu Organları", "Destek ve Hareket", "Sindirim-Dolaşım-Solunum-Boşaltım", "Genden Proteine", "Canlılarda Enerji Dönüşümü", "Bitki Biyolojisi"]
  },
  "AYT_EA": {
    "Matematik (AYT)": ["Trigonometri", "Logaritma", "Diziler", "Limit-Türev-İntegral"],
    "Edebiyat (AYT)": ["Şiir Bilgisi", "Edebi Sanatlar", "İslamiyet Öncesi-Halk-Divan Edebiyatı", "Tanzimat-Servet-i Fünun-Milli Edebiyat", "Cumhuriyet Dönemi Türk Edebiyatı", "Yazar-Eser"],
    "Tarih-1 (AYT)": ["Osmanlı Tarihi (Tamam)", "20. Yüzyıl Başlarında Dünya", "I. Dünya Savaşı", "Kurtuluş Savaşı", "Cumhuriyet İnkılapları"],
    "Coğrafya-1 (AYT)": ["Ekosistem", "Nüfus Politikaları", "Türkiye Ekonomisi", "Türkiye'nin Jeopolitiği", "Küresel Ticaret"]
  }
};

export default function StudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [student, setStudent] = useState<any>(null);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Seçim State'leri
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [qCount, setQCount] = useState("50");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: sData } = await supabase.from('students').select('*').eq('id', id).single();
      const { data: tData } = await supabase.from('student_tasks').select('*').eq('student_id', id).order('due_date', { ascending: true });
      const { data: eData } = await supabase.from('exams').select('*').eq('student_id', id).order('created_at', { ascending: true });

      setStudent(sData);
      setAssignedTasks(tData || []);
      setExams(eData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- HİBRİT MÜFREDAT OLUŞTURUCU (BOZMADAN) ---
  const activeCurriculum = useMemo(() => {
    if (!student) return {};
    const level = String(student.grade_level);
    const major = student.major;

    // YKS GRUBU (12 ve Mezun) -> TYT CORE + BRANŞ AYT
    if (level === "12" || level === "Mezun") {
      let combined = { ...CURRICULUM_POOL["TYT_CORE"] };
      if (major === "SAY") Object.assign(combined, CURRICULUM_POOL["AYT_SAY"]);
      if (major === "EA") Object.assign(combined, CURRICULUM_POOL["AYT_EA"]);
      return combined;
    }

    // ARA SINIFLAR VE LGS
    return CURRICULUM_POOL[level] || {};
  }, [student]);

  const availableCourses = useMemo(() => Object.keys(activeCurriculum), [activeCurriculum]);
  const availableTopics = useMemo(() => selectedCourse ? activeCurriculum[selectedCourse] || [] : [], [selectedCourse, activeCurriculum]);

  const handleAddTask = async () => {
    if (!selectedTopic) return toast.error("Konu seçin!");
    const newTask = {
      student_id: id,
      topic_name: `${selectedCourse} - ${selectedTopic}`,
      target_questions: parseInt(qCount),
      due_date: selectedDate,
      status: 'pending'
    };
    try {
      await supabase.from('student_tasks').insert([newTask]);
      toast.success("Görev Sisteme İşlendi!");
      setIsModalOpen(false);
      fetchData(); // Listeyi tazele
    } catch (err) {
      toast.error("Hata!");
    }
  };

  const tasksByDate = useMemo(() => {
    const groups: Record<string, any[]> = {};
    assignedTasks.forEach(t => {
      const d = t.due_date || 'Belirsiz';
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    });
    return groups;
  }, [assignedTasks]);

  const chartData = exams.map((e, i) => ({ name: `D${i + 1}`, net: e.total_net }));
  const lastNet = exams.length > 0 ? exams[exams.length - 1].total_net : 0;
  const isUp = exams.length >= 2 ? lastNet >= exams[exams.length - 2].total_net : true;

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-xs uppercase italic tracking-widest"> ANALİZ MERKEZİ YÜKLENİYOR...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 pb-32">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <Button onClick={() => router.back()} variant="ghost" className="font-black text-slate-400 uppercase text-[10px] tracking-widest">
          <ArrowLeft size={16} className="mr-2" /> Geri Dön
        </Button>
        <div className="flex gap-4 italic font-black uppercase text-[10px] tracking-widest text-slate-400">
          <span className="flex items-center gap-1 text-slate-900 bg-white px-4 py-2 rounded-full shadow-sm">
            <BookOpen size={14} className="text-blue-600" /> {student?.grade_level}. SINIF • {student?.major}
          </span>
        </div>
      </div>

      {/* DASHBOARD İSTATİSTİKLER (ORİJİNAL) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col items-center">
          <div className="p-4 bg-blue-50 rounded-2xl mb-3 text-blue-600"><Hash size={24} /></div>
          <span className="text-3xl font-black italic">{lastNet}</span>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1"> Son Net</p>
        </Card>
        <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col items-center border-b-4 border-orange-500">
          <div className="p-4 bg-orange-50 rounded-2xl mb-3 text-orange-600"><Clock size={24} /></div>
          <span className="text-3xl font-black italic"> {assignedTasks.length}</span>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1"> Aktif Görev</p>
        </Card>
        <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col items-center">
          <div className="p-4 bg-purple-50 rounded-2xl mb-3 text-purple-600"><Timer size={24} /></div>
          <span className="text-3xl font-black italic"> %65</span>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1"> Tamamlama</p>
        </Card>
        <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-slate-900 text-white flex flex-col items-center">
          <div className="p-4 bg-white/10 rounded-2xl mb-3 text-blue-400"><Target size={24} /></div>
          <span className="text-3xl font-black italic"> 95.0</span>
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1"> Hedef Net</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* NET GRAFİĞİ (ORİJİNAL) */}
          <Card className="p-10 rounded-[3rem] border-none shadow-sm bg-white h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <Activity className="text-blue-600" size={24} /> Akademik Gelişim
              </h3>
              <div className={`flex items-center gap-2 font-black italic ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                {isUp ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                <span className="text-xs uppercase"> TREND</span>
              </div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900 }} />
                  <Line type="monotone" dataKey="net" stroke="#2563eb" strokeWidth={5} dot={{ r: 6, fill: '#2563eb', strokeWidth: 3, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* PROGRAM LİSTESİ */}
          <div className="space-y-6 text-left">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <CalendarIcon size={24} className="text-blue-600" /> Günlük Program
              </h3>
              <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-slate-900 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest px-8 h-14 shadow-xl shadow-blue-100 transition-all"> GÖREV ATA</Button>
            </div>
            <div className="space-y-8">
              {Object.keys(tasksByDate).map(date => (
                <div key={date} className="space-y-4">
                  <span className="px-5 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-full uppercase tracking-widest">{date}</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tasksByDate[date].map((t, i) => (
                      <Card key={i} className="p-6 rounded-[2rem] border-none shadow-sm bg-white">
                        <h4 className="text-[11px] font-black uppercase italic mb-2 text-slate-800">{t.topic_name}</h4>
                        <div className="flex items-center gap-3 text-[9px] font-bold uppercase text-slate-400">
                          <span className="flex items-center gap-1"><Hash size={12} /> {t.target_questions} Soru Hedefi</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SAĞ PANEL (ORİJİNAL) */}
        <Card className="p-8 rounded-[3rem] border-none shadow-sm bg-white h-fit sticky top-10">
          <h3 className="text-lg font-black italic uppercase tracking-tighter mb-8 text-left"> Soru Trendi</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ n: 'Pt', s: 200 }, { n: 'Sa', s: 150 }, { n: 'Çş', s: 300 }, { n: 'Pş', s: 250 }, { n: 'Cu', s: 400 }]}>
                <Bar dataKey="s" fill="#2563eb" radius={[10, 10, 0, 0]} />
                <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* --- AKILLI GÖREV MODALI (TYT + AYT BİRLEŞİK) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 relative z-10 animate-in zoom-in duration-300 border-none">
            <Button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all p-0 border-none shadow-sm"><X size={24} /></Button>
            
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-10 text-slate-900 text-left leading-none tracking-[-0.05em]">GÖREV TANIMLA</h2>
            
            <div className="space-y-6 text-left">
              {/* DERS */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block italic opacity-70">1. DERS SEÇİMİ</label>
                <select 
                  className="w-full h-16 bg-slate-50 rounded-[1.5rem] px-8 font-black text-[11px] uppercase outline-none border-2 border-transparent focus:border-blue-600 transition-all text-slate-900"
                  value={selectedCourse}
                  onChange={(e) => { setSelectedCourse(e.target.value); setSelectedTopic(""); }}
                >
                  <option value="">DERS SEÇİNİZ...</option>
                  {availableCourses.map(course => <option key={course} value={course}>{course}</option>)}
                </select>
              </div>

              {/* KONU */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block italic opacity-70">2. KONU SEÇİMİ</label>
                <select 
                  disabled={!selectedCourse}
                  className="w-full h-16 bg-slate-50 rounded-[1.5rem] px-8 font-black text-[11px] uppercase outline-none border-2 border-transparent focus:border-blue-600 transition-all disabled:opacity-30 text-slate-900"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                >
                  <option value="">KONU SEÇİNİZ...</option>
                  {availableTopics.map((t: string) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* TARİH VE SORU */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block italic opacity-70">BİTİŞ TARİHİ</label>
                  <input type="date" className="w-full h-16 bg-slate-50 rounded-[1.5rem] px-6 font-black text-xs outline-none text-slate-900" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block italic opacity-70">SORU HEDEFİ</label>
                  <input type="number" className="w-full h-16 bg-slate-50 rounded-[1.5rem] px-6 font-black text-center text-lg outline-none text-slate-900" value={qCount} onChange={(e) => setQCount(e.target.value)} />
                </div>
              </div>

              <Button onClick={handleAddTask} className="w-full h-20 bg-slate-900 hover:bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl transition-all duration-300 mt-4 shadow-blue-100 active:scale-95">
                GÖREVİ SİSTEME İŞLE
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
