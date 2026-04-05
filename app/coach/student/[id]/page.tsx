'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, TrendingDown, Calendar, Target, CheckCircle2, 
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

// --- ENTEGRE EDİLMİŞ DEV MÜFREDAT HAVUZU ---
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
  const [exams, setExams] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Görev Formu State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    subject: '',
    topic: '',
    targetQuestions: '',
    dueDate: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: sData } = await supabase.from('profiles').select('*').eq('id', id).single();
      setStudent(sData);

      const { data: eData } = await supabase.from('exams').select('*').eq('student_id', id).order('exam_date', { ascending: false });
      setExams(eData || []);

      const { data: tData } = await supabase.from('student_tasks').select('*').eq('student_id', id).order('created_at', { ascending: false });
      setTasks(tData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sınıf ve Branşa göre müfredat filtreleme motoru
  const getAvailableCurriculum = () => {
    if (!student) return {};
    const level = student.class_level;
    const branch = student.branch;

    // 5-11. Sınıf Arası Filtreleme
    if (["5", "6", "7", "8", "9", "10", "11"].includes(level)) {
      return CURRICULUM_POOL[level] || {};
    }

    // 12 ve Mezunlar İçin Filtreleme
    if (level === '12' || level === 'mezun') {
      const tyt = CURRICULUM_POOL["TYT_CORE"];
      let ayt = {};
      if (branch === 'Sayısal') ayt = CURRICULUM_POOL["AYT_SAY"];
      if (branch === 'Eşit Ağırlık') ayt = CURRICULUM_POOL["AYT_EA"];
      // Sözel için ek kısımlar buraya eklenebilir.
      return { ...tyt, ...ayt };
    }

    return {};
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('student_tasks').insert([{
        student_id: id,
        topic_name: `${taskForm.subject} - ${taskForm.topic}`,
        target_questions: parseInt(taskForm.targetQuestions),
        due_date: taskForm.dueDate,
        status: 'pending'
      }]);

      if (error) throw error;
      toast.success("Ödev başarıyla atandı!");
      setIsTaskModalOpen(false);
      setTaskForm({ subject: '', topic: '', targetQuestions: '', dueDate: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('student_tasks').delete().eq('id', taskId);
    if (error) toast.error("Hata oluştu");
    else {
      toast.success("Görev silindi");
      fetchData();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse uppercase italic tracking-[0.3em]">Analiz Ediliyor...</div>;

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
          {/* ÖDEV MODALI */}
          <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 md:flex-none bg-blue-600 hover:bg-slate-900 text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 transition-all active:scale-95">
                <Plus size={18} className="mr-2" /> Yeni Görev Tanımla
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
              <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12"><ClipboardList size={120} /></div>
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                    <Sparkles className="text-blue-400" /> Görevlendir
                  </DialogTitle>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Müfredat Bazlı Ödev Ataması</p>
                </DialogHeader>
              </div>

              <form onSubmit={handleCreateTask} className="p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest italic">Ders Seçimi</label>
                    <Select onValueChange={(val) => setTaskForm({...taskForm, subject: val, topic: ''})}>
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
                        <SelectValue placeholder="Ders Seçin" />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-2xl shadow-2xl border-slate-100">
                        {Object.keys(currentCurriculum).map(ders => (
                          <SelectItem key={ders} value={ders} className="font-bold py-3">{ders}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest italic">Konu Seçimi</label>
                    <Select disabled={!taskForm.subject} onValueChange={(val) => setTaskForm({...taskForm, topic: val})}>
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold disabled:opacity-40">
                        <SelectValue placeholder="Konu Seçin" />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-2xl shadow-2xl border-slate-100">
                        {taskForm.subject && currentCurriculum[taskForm.subject]?.map((konu: string) => (
                          <SelectItem key={konu} value={konu} className="font-bold py-3">{konu}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest italic">Soru Hedefi</label>
                    <div className="relative">
                       <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                       <Input type="number" placeholder="Örn: 150" required className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold" value={taskForm.targetQuestions} onChange={e => setTaskForm({...taskForm, targetQuestions: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest italic">Son Tarih</label>
                    <div className="relative">
                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                       <Input type="date" required className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full h-16 bg-blue-600 hover:bg-slate-900 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-100 transition-all">
                  Ödevi Sisteme İşle <Send size={16} className="ml-2" />
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="flex-1 md:flex-none rounded-2xl h-14 px-8 border-2 border-slate-100 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50">
            <MessageCircle size={18} className="mr-2" /> İletişim
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AKTİF GÖREVLER LİSTESİ */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Target size={20} /></div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter">Haftalık Görevler</h2>
              </div>
              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-4 py-2 rounded-full uppercase italic tracking-widest">{tasks.length} Aktif</span>
            </div>
            
            <div className="space-y-4">
              {tasks.length > 0 ? tasks.map((task) => (
                <div key={task.id} className="group flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-blue-100 hover:bg-white transition-all">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-2xl ${task.status === 'completed' ? 'bg-green-100 text-green-600 shadow-green-50' : 'bg-amber-100 text-amber-600 shadow-amber-50'} shadow-lg`}>
                      {task.status === 'completed' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 uppercase italic tracking-tighter text-md">{task.topic_name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hedef: {task.target_questions} Soru</p>
                         <div className="w-1 h-1 bg-slate-300 rounded-full" />
                         <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Teslim: {new Date(task.due_date).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => deleteTask(task.id)} variant="ghost" className="h-12 w-12 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={20} />
                  </Button>
                </div>
              )) : (
                <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                  <BookOpen size={48} className="mx-auto mb-4 text-slate-200" />
                  <p className="font-black uppercase text-[10px] italic tracking-widest text-slate-400">Henüz bir ödev ataması yapılmadı</p>
                </div>
              )}
            </div>
          </Card>

          {/* DENEME ANALİZLERİ */}
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white">
             <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Sparkles size={20} /></div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter">Deneme Analizleri</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 group hover:border-purple-200 transition-all">
                    <div>
                      <h4 className="font-black text-slate-900 uppercase italic tracking-tighter text-sm">{exam.exam_name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">{new Date(exam.exam_date).toLocaleDateString('tr-TR')} • {exam.exam_type}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black italic text-blue-600 leading-none group-hover:text-purple-600 transition-colors">{exam.total_net}</span>
                      <p className="text-[9px] font-black uppercase text-slate-300 tracking-tighter mt-1 italic">Net</p>
                    </div>
                  </div>
                ))}
              </div>
          </Card>
        </div>

        
        {/* SAĞ PANEL: ÖZET VE NOTLAR */}
        <div className="space-y-8">
           {/* Gelişim Kartı */}
           <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-slate-900 text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                <TrendingUp size={120} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 italic mb-2">Akademik Performans</p>
             <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-6">
                {tasks.length > 0 && (tasks.filter(t => t.status === 'completed').length / tasks.length) > 0.7 ? 'Mükemmel' : 'Gelişiyor'}
             </h3>
             
             <div className="space-y-4 relative z-10">
               <div className="flex justify-between items-center py-4 border-b border-white/10">
                 <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest italic">Ödev Tamamlama</span>
                 <span className="font-black italic text-lg">
                    %{tasks.length > 0 ? ((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100).toFixed(0) : 0}
                 </span>
               </div>
               <div className="flex justify-between items-center py-4 border-b border-white/10">
                 <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest italic">Ortalama Net</span>
                 <span className="font-black italic text-lg text-blue-400">
                    {exams.length > 0 ? (exams.reduce((acc, curr) => acc + Number(curr.total_net), 0) / exams.length).toFixed(1) : 0}
                 </span>
               </div>
               <div className="flex justify-between items-center py-4">
                 <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest italic">Sistem Kaydı</span>
                 <span className="font-black italic text-slate-500 text-xs">
                    {new Date(student?.created_at).toLocaleDateString('tr-TR')}
                 </span>
               </div>
             </div>
           </Card>

           {/* Koç Notu Kartı */}
           <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white border border-slate-100">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl"><AlertCircle size={20} /></div>
                <h2 className="text-lg font-black italic uppercase tracking-tighter">Koçun Değerlendirmesi</h2>
              </div>
              <textarea 
                className="w-full h-40 bg-slate-50 border-none rounded-3xl p-6 text-sm font-bold placeholder:text-slate-300 focus:ring-2 ring-blue-500/20 outline-none resize-none transition-all"
                placeholder="Öğrencinin bu haftaki performansı, eksikleri ve motivasyon durumu hakkında notlar alın..."
                defaultValue={student?.notes || ""}
              ></textarea>
              <Button 
                onClick={async () => {
                  const noteValue = (document.querySelector('textarea') as HTMLTextAreaElement).value;
                  const { error } = await supabase.from('profiles').update({ notes: noteValue }).eq('id', id);
                  if (error) toast.error("Not kaydedilemedi");
                  else toast.success("Koç notu güncellendi");
                }}
                className="w-full mt-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200 transition-all active:scale-95"
              >
                Değerlendirmeyi Kaydet
              </Button>
           </Card>

           {/* Hızlı Erişim Kartı */}
           <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-blue-50/50 border border-blue-100/50">
              <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest mb-4 text-center italic">Hızlı İşlemler</p>
              <div className="grid grid-cols-2 gap-3">
                 <Button variant="ghost" className="h-12 bg-white rounded-xl font-bold text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm">Program Yaz</Button>
                 <Button variant="ghost" className="h-12 bg-white rounded-xl font-bold text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm">Veli Arandı</Button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
