export const GRADES = [
  { id: "5", label: "5. Sınıf" },
  { id: "6", label: "6. Sınıf" },
  { id: "7", label: "7. Sınıf" },
  { id: "8", label: "8. Sınıf (LGS)" },
  { id: "9", label: "9. Sınıf" },
  { id: "10", label: "10. Sınıf" },
  { id: "11", label: "11. Sınıf" },
  { id: "12", label: "12. Sınıf (YKS)" },
  { id: "mezun", label: "Mezun (YKS Hazırlık)" },
];

export const SUBJECTS_BY_GRADE: Record<string, string[]> = {
  "5": ["Matematik", "Türkçe", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din Kültürü"],
  "6": ["Matematik", "Türkçe", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din Kültürü"],
  "7": ["Matematik", "Türkçe", "Fen Bilimleri", "Sosyal Bilgiler", "İngilizce", "Din Kültürü"],
  "8": ["Matematik (LGS)", "Türkçe (LGS)", "Fen Bilimleri (LGS)", "İnkılap Tarihi", "İngilizce", "Din Kültürü"],
  "9": ["Matematik", "Türkçe/Edebiyat", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya", "Sağlık Bilgisi"],
  "10": ["Matematik", "Türkçe/Edebiyat", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya", "Felsefe"],
  "11": ["Matematik", "Türkçe/Edebiyat", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya", "Felsefe"],
  "12": ["Matematik (TYT-AYT)", "Türkçe (TYT)", "Edebiyat (AYT)", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya", "Geometri"],
  "mezun": ["Matematik (TYT-AYT)", "Türkçe (TYT)", "Edebiyat (AYT)", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya", "Geometri"],
};

// Her sınıf seviyesine özel temel konular (Koçun hızlıca seçebilmesi için)
export const TOPICS_BY_SUBJECT: Record<string, string[]> = {
  // LGS Grubu
  "Matematik (LGS)": ["Çarpanlar ve Katlar", "Üslü İfadeler", "Kareköklü İfadeler", "Veri Analizi", "Olasılık"],
  "Türkçe (LGS)": ["Sözcükte Anlam", "Cümlede Anlam", "Paragraf", "Fiilimsiler", "Cümlenin Ögeleri"],
  
  // YKS / Ara Sınıf Grubu
  "Matematik (TYT-AYT)": ["Temel Kavramlar", "Rasyonel Sayılar", "Fonksiyonlar", "Trigonometri", "Türev", "İntegral"],
  "Fizik": ["Vektörler", "Kuvvet ve Hareket", "Enerji", "Elektrik", "Optik", "Modern Fizik"],
  "Kimya": ["Atom ve Yapısı", "Periyodik Sistem", "Mol Kavramı", "Asit-Baz", "Organik Kimya"],
  "Biyoloji": ["Hücre", "Kalıtım", "Sistemler", "Ekoloji", "Bitki Biyolojisi"],
  
  // Ara Sınıf Genel
  "Matematik": ["Sayılar", "Bölünebilme", "Denklemler", "Üçgenler", "Veri"],
  "Fen Bilimleri": ["Güneş Sistemi", "Vücudumuzdaki Sistemler", "Kuvvet ve Hareket", "Madde ve Değişim"],
};
