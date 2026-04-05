'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowLeft, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

export default function StudentCurriculumPage() {
  const [student, setStudent] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<any>({});
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
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

      // 1. Profil Bilgisi
      const { data: sData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setStudent(sData);

      // 2. Müfredatı Belirle
      const level = sData?.class_level || "12";
      const branch = sData?.branch || "Sayısal";
      let filtered: any = {};

      if (["5", "6", "7", "8", "9", "10", "11"].includes(level)) {
        filtered = CURRICULUM_POOL[level] || {};
      } else {
        const tyt = CURRICULUM_POOL["TYT_CORE"] || {};
        let ayt = {};
        if (branch === 'Sayısal') ayt = CURRICULUM_POOL["AYT_SAY"] || {};
        if (branch === 'Eşit Ağırlık') ayt = CURRICULUM_POOL["AYT_EA"] || {};
        filtered = { ...tyt, ...ayt };
      }

      setCurriculum(filtered);
      
      // İlk dersi seç
      const lessonKeys = Object.keys(filtered);
      if (lessonKeys.length > 0 && !activeSubject) {
        setActiveSubject(lessonKeys[0]);
      }

      // 3. TAMAMLANANLARI ÇEK (En Kritik Nokta)
      // student_curriculum tablosundaki verileri topic_name olarak çekiyoruz
      const { data: cData, error: cError } = await supabase
        .from('student_curriculum')
        .select('topic_name')
        .eq('student_id', user.id);

      if (cError) throw cError;
      
      if (cData) {
        // Gelen veriyi bir string dizisine çeviriyoruz
        const doneList = cData.map((item: any) => item.topic_name);
        setCompletedTopics(doneList);
      }

    } catch (error) {
      console.error("Veri çekme hatası:", error);
      toast.error("Veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [supabase, activeSubject]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleTopic = async (topicName: string) => {
    try {
      setUpdating(topicName);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isDone = completedTopics.includes(topicName);

      if (isDone) {
        // Veritabanından Sil
        const { error } = await supabase
          .from('student_curriculum')
          .delete()
          .match({ student_id: user.id, topic_name: topicName });

        if (error) throw error;
        setCompletedTopics(prev => prev.filter(t => t !== topicName));
        toast.success("Konu 'Çalışılacak' olarak işaretlendi.");
      } else {
        // Veritabanına Ekle
        const { error } = await supabase
          .from('student_curriculum')
          .insert([{ 
            student_id: user.id, 
            subject_id: activeSubject, 
            topic_name: topicName, 
            is_completed: true,
            completed_at: new Date().toISOString()
          }]);

        if (error) throw error;
        setCompletedTopics(prev => [...prev, topicName]);
        toast.success("Konu 'Tamamlandı' ✅");
      }
    } catch (error: any) {
      console.error("Güncelleme hatası:", error);
      toast.error("İşlem kaydedilemedi: " + error.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-xs uppercase italic tracking-widest">Müfredat Senkronize Ediliyor...</div>;

  const currentTopics = activeSubject ? curriculum[activeSubject] || [] : [];
  const completedCount = currentTopics.filter((t: string) => completedTopics.includes(t)).length;
  const progress = currentTopics.length > 0 ? Math.round((completedCount / currentTopics.length) * 100) : 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 gap-6 text-left relative overflow-hidden">
        <div className="absolute top-[-20px] right-[-20px] opacity-5 rotate-12"><Sparkles size={160} /></div>
        <div className="flex items-center gap-6 relative z-10">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full w-14 h-14 p-0 bg-slate-50 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
            <ArrowLeft size={28} />
          </Button>
          <div className="text-left">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-2">
              <Sparkles className="text-blue-600" /> {student?.class_level}. Sınıf Müfredatı
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1 italic">Branş: {student?.branch || 'Genel'}</p>
          </div>
        </div>
        <div className="w-full md:w-72 text-left relative z-10 bg-slate-50 p-6 rounded-[2rem]">
          <div className="flex justify-between items-end mb-2">
             <p className="text-[10px] font-black uppercase italic text-blue-600">Ders İlerlemesi</p>
             <p className="text-xl font-black italic">%{progress}</p>
          </div>
          <Progress value={progress} className="h-3 bg-white shadow-inner border border-slate-100" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sol Menü: Dersler */}
        <div className="lg:col-span-1 space-y-3 overflow-y-auto no-scrollbar pb-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-4 text-left italic opacity-50">Dersler</p>
          {Object.keys(curriculum).map((subject) => (
            <button 
              key={subject} 
              onClick={() => setActiveSubject(subject)} 
              className={`w-full p-5 rounded-[2.2rem] flex items-center gap-4 transition-all border-2 ${
                activeSubject === subject 
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-[1.03] z-10' 
                : 'bg-white text-slate-500 border-transparent hover:border-blue-100 hover:bg-blue-50/30'
              }`}
            >
              <div className={`w-11 h-11 rounded-[1rem] flex items-center justify-center font-black text-xs shadow-sm ${
                activeSubject === subject ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'
              }`}>
                {subject.substring(0, 2).toUpperCase()}
              </div>
              <span className="font-black text-[10px] uppercase tracking-tight text-left leading-tight">{subject}</span>
            </button>
          ))}
        </div>

        {/* Sağ Panel: Konular */}
        <div className="lg:col-span-3">
          <Card className="rounded-[3.5rem] border-none shadow-sm bg-white p-12 min-h-[650px] text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 rotate-45"><BookOpen size={150} /></div>
            <div className="relative z-10">
               <h2 className="font-black text-3xl uppercase tracking-tighter italic mb-10 flex items-center gap-4">
                 <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><BookOpen size={24} /></div>
                 {activeSubject} Müfredat Detayı
               </h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {currentTopics.map((topic: string, index: number) => {
                   const isDone = completedTopics.includes(topic);
                   return (
                     <button 
                       key={index} 
                       disabled={updating === topic} 
                       onClick={() => toggleTopic(topic)} 
                       className={`group p-6 rounded-[2.5rem] flex items-center justify-between transition-all border-2 text-left relative overflow-hidden ${
                         isDone 
                         ? 'bg-emerald-50 border-emerald-100 text-emerald-900' 
                         : 'bg-slate-50 border-transparent hover:bg-white hover:border-blue-100 hover:shadow-xl text-slate-600'
                       }`}
                     >
                       <div className="flex items-center gap-5 relative z-10">
                         {updating === topic ? (
                           <Loader2 className="animate-spin text-blue-600" size={24} />
                         ) : isDone ? (
                           <div className="bg-emerald-500 p-1.5 rounded-full shadow-lg shadow-emerald-200">
                             <CheckCircle2 size={20} className="text-white" />
                           </div>
                         ) : (
                           <div className="p-1 rounded-full border-2 border-slate-200 group-hover:border-blue-400 transition-colors">
                             <Circle size={20} className="text-transparent" />
                           </div>
                         )}
                         <span className={`text-sm font-black tracking-tight uppercase italic ${isDone ? 'opacity-40 line-through' : ''}`}>
                           {topic}
                         </span>
                       </div>
                       {isDone && <Sparkles size={16} className="text-emerald-400 opacity-50" />}
                     </button>
                   );
                 })}
               </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
