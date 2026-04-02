'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, Plus, Trash2, 
  Upload, Loader2, Globe, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// BURASI KRİTİK: "export default" ifadesi mutlaka olmalı
export default function CoachResourcesPage() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // useEffect içindeki fetchData fonksiyonunu bu versiyonla değiştirin:
const fetchData = async () => {
  try {
    setLoading(true);

    // 1. Önce mevcut oturumu kontrol et (Lock stealing hatasını minimize eder)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.warn("Oturum bulunamadı veya kilit hatası.");
      return;
    }

    const user = session.user;

    // 2. Öğrencileri çek (Join kullanmadan temiz çekim)
    const { data: sData, error: sError } = await supabase
      .from('students')
      .select('*')
      .eq('coach_id', user.id);
    
    if (sError) throw sError;

    // 3. Mevcut kaynakları çek
    const { data: rData, error: rError } = await supabase
      .from('resources')
      .select('*, resource_access(student_id)')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false });

    if (rError) throw rError;

    setStudents(sData || []);
    setResources(rData || []);
  } catch (error: any) { 
    // Hata mesajını kullanıcıya göstermeden logla (Lock hataları geçicidir)
    if (!error.message.includes('lock')) {
      console.error("Veri çekme hatası:", error.message);
    }
  } finally { 
    setLoading(false); 
  }
};

    fetchData();
  }, [supabase]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || selectedStudents.length === 0) {
      return toast.error("Lütfen başlık, dosya ve öğrenci seçiniz.");
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Dosyayı Storage'a yükle (resources bucket'ı açık olmalı)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('resources')
        .upload(fileName, file);

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(fileName);

      // 2. Veritabanına kaydet
      const { data: resourceData, error: dbError } = await supabase
        .from('resources')
        .insert({
          coach_id: user?.id,
          title,
          file_url: publicUrl,
          file_type: fileExt === 'pdf' ? 'pdf' : 'image'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 3. Erişim yetkilerini tanımla
      const accessData = selectedStudents.map(sId => ({
        resource_id: resourceData.id,
        student_id: sId
      }));
      
      const { error: accessError } = await supabase.from('resource_access').insert(accessData);
      if (accessError) throw accessError;

      toast.success("Dosya başarıyla yayınlandı! 🚀");
      window.location.reload();
    } catch (error: any) { 
      toast.error("Yükleme Hatası: " + error.message); 
    } finally { 
      setUploading(false); 
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50 font-black text-blue-600 animate-pulse uppercase">
      Kütüphane Hazırlanıyor...
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 bg-slate-50 min-h-screen text-slate-900">
      
      {/* ÜST BAR */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="ghost" className="rounded-full w-12 h-12 p-0 bg-slate-50">
            <ArrowLeft size={20} />
          </Button>
          <div>
             <h1 className="text-3xl font-black tracking-tight">Kaynak Kütüphanesi</h1>
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">Döküman Paylaşım Merkezi</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* SOL: DOSYA YÜKLEME FORMU */}
        <div className="lg:col-span-5">
           <Card className="rounded-[3rem] border-none shadow-sm bg-white p-10 sticky top-8">
              <h3 className="text-xl font-black italic mb-8 flex items-center gap-3">
                <Plus className="text-blue-600" /> Yeni Döküman Paylaş
              </h3>
              <form onSubmit={handleUpload} className="space-y-6">
                 <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-2">Başlık</Label>
                    <Input 
                      placeholder="Örn: Limit ve Süreklilik Özeti" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold" 
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-2">Dosya (PDF veya Görsel)</Label>
                    <div className="relative h-32 w-full border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer overflow-hidden">
                       <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={(e) => setFile(e.target.files?.[0] || null)} 
                       />
                       <Upload className="text-slate-300 mb-2" size={32} />
                       <p className="text-[10px] font-black text-slate-400 uppercase text-center px-4">
                         {file ? file.name : "Dosyayı buraya sürükle veya tıkla"}
                       </p>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-2">Hangi Öğrenciler Görecek?</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 custom-scrollbar">
                       {students.map(s => (
                         <label key={s.id} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${selectedStudents.includes(s.id) ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                           <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={selectedStudents.includes(s.id)} 
                            onChange={(e) => e.target.checked 
                              ? setSelectedStudents([...selectedStudents, s.id]) 
                              : setSelectedStudents(selectedStudents.filter(id => id !== s.id))} 
                           />
                           <span className="text-[11px] font-black uppercase tracking-widest">{s.full_name}</span>
                         </label>
                       ))}
                    </div>
                 </div>

                 <Button disabled={uploading} className="w-full h-18 rounded-[2rem] bg-slate-900 text-white font-black hover:bg-blue-600 transition-all shadow-xl">
                    {uploading ? <Loader2 className="animate-spin" /> : "Şimdi Yayınla 🚀"}
                 </Button>
              </form>
           </Card>
        </div>

        {/* SAĞ: ÖNCEDEN PAYLAŞILANLAR */}
        <div className="lg:col-span-7 space-y-6">
           <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest ml-4 italic flex items-center gap-2">
              <Globe size={18} className="text-blue-600" /> Aktif Kaynaklar ({resources.length})
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources.map(res => (
                <Card key={res.id} className="rounded-[2.5rem] border-none shadow-sm bg-white p-8 hover:shadow-xl transition-all group">
                   <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-6">
                      <FileText size={28} />
                   </div>
                   <h4 className="font-black text-slate-900 leading-tight mb-2 uppercase italic text-sm">{res.title}</h4>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">
                      {new Date(res.created_at).toLocaleDateString('tr-TR')} tarihinde yüklendi
                   </p>
                   <a 
                    href={res.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full h-12 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors"
                   >
                      Dosyayı Görüntüle
                   </a>
                </Card>
              ))}
              {resources.length === 0 && (
                <div className="col-span-2 py-20 text-center text-slate-400 font-bold italic opacity-50">
                  Henüz hiç kaynak paylaşmadınız.
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
