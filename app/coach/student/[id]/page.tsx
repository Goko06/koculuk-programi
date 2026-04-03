'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, TrendingUp, Target, BookOpen, Activity, 
  MessageCircle, Plus, X, CheckCircle2, Clock, Hash, 
  Flame, Timer, Calendar as CalendarIcon, TrendingDown
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// --- MÜFREDAT HAVUZU ---
const SUBJECTS_POOL = [
  { id: 'tur-lgs', name: 'LGS Türkçe', icon: '📝', level: 'LGS', majors: ['LGS'], topics: ['Sözcükte Anlam', 'Cümlede Anlam', 'Paragraf', 'Fiilimsiler', 'Cümlenin Ögeleri', 'Yazım Kuralları'] },
  { id: 'mat-lgs', name: 'LGS Matematik', icon: '📐', level: 'LGS', majors: ['LGS'], topics: ['Çarpanlar ve Katlar', 'Üslü İfadeler', 'Kareköklü İfadeler', 'Olasılık', 'Cebirsel İfadeler'] },
  { id: 'fen-lgs', name: 'LGS Fen Bilimleri', icon: '🧪', level: 'LGS', majors: ['LGS'], topics: ['Mevsimler', 'DNA ve Genetik Kod', 'Basınç', 'Madde ve Endüstri'] },
  { id: 'ink-lgs', name: 'LGS İnkılap', icon: '📜', level: 'LGS', majors: ['LGS'], topics: ['Bir Kahraman Doğuyor', 'Milli Uyanış', 'Ya İstiklal Ya Ölüm'] },
  { id: 'din-lgs', name: 'LGS Din Kültürü', icon: '🌙', level: 'LGS', majors: ['LGS'], topics: ['Kader İnancı', 'Zekat ve Sadaka', 'Din ve Hayat'] },
  { id: 'mat-tyt', name: 'TYT Matematik', icon: '📐', level: 'YKS', majors: ['SAY', 'EA', 'SOZ'], topics: ['Temel Kavramlar', 'Problemler', 'Fonksiyonlar'] },
  { id: 'mat-ayt', name: 'AYT Matematik', icon: '📊', level: 'YKS', majors: ['SAY', 'EA'], topics: ['Trigonometri', 'Limit', 'Türev', 'İntegral'] }
];

export default function StudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [student, setStudent] = useState<any>(null);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // Form State
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
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
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [id, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredSubjects = useMemo(() => {
    if (!student) return [];
    if (student.grade_level === "8" || student.major === "LGS") return SUBJECTS_POOL.filter(s => s.level === 'LGS');
    return SUBJECTS_POOL.filter(s => s.level === 'YKS' && s.majors.includes(student.major));
  }, [student]);

  const handleAddTask = async () => {
    if (!selectedTopic) return toast.error("Konu seçin!");
    const newTask = { student_id: id, topic_name: `${selectedSubject.name} - ${selectedTopic}`, target_questions: parseInt(qCount), due_date: selectedDate, status: 'pending' };
    setAssignedTasks(prev => [...prev, newTask]);
    setIsModalOpen(false);
    toast.success("Görev planlandı!");
    try { await supabase.from('student_tasks').insert([newTask]); } catch (err) { console.error(err); }
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

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-xs uppercase italic">ANALİZ EDİLİYOR...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen text-slate-900 pb-32">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <Button onClick={() => router.back()} variant="ghost" className="font-black text-slate-400 uppercase text-[10px] tracking-widest transition-all">
          <ArrowLeft size={16} className="mr-2" /> Geri Dön
        </Button>
        <div className="flex gap-4 italic font-black uppercase text-[10px] tracking-widest text-slate-400">
           <span className="flex items-center gap-1"><Flame size={14} className="text-orange-500" /> SERİ: 12 GÜN</span>
        </div>
      </div>

      {/* DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col items-center">
            <div className="p-4 bg-blue-50 rounded-2xl mb-3 text-blue-600"><Hash size={24} /></div>
            <span className="text-3xl font-black italic">{lastNet}</span>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Son Net</p>
         </Card>
         <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col items-center">
            <div className="p-4 bg-purple-50 rounded-2xl mb-3 text-purple-600"><Timer size={24} /></div>
            <span className="text-3xl font-black italic">42 Seans</span>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Pomodoro</p>
         </Card>
         <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white flex flex-col items-center border-b-4 border-blue-600 text-left">
            <div className="p-4 bg-orange-50 rounded-2xl mb-3 text-orange-600"><Clock size={24} /></div>
            <span className="text-3xl font-black italic">28s 15dk</span>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Çalışma</p>
         </Card>
         <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-slate-900 text-white flex flex-col items-center">
            <div className="p-4 bg-white/10 rounded-2xl mb-3 text-blue-400"><Target size={24} /></div>
            <span className="text-3xl font-black italic">95.0</span>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1 text-center leading-none">Hedef Net</p>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL: GRAFİK VE AJANDA */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* NET GELİŞİM GRAFİĞİ (GERİ GELDİ!) */}
          <Card className="p-10 rounded-[3rem] border-none shadow-sm bg-white h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <Activity className="text-blue-600" size={24} /> Net Gelişim Analizi
              </h3>
              {exams.length > 0 && (
                <div className={`flex items-center gap-2 font-black italic ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                  {isUp ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                  <span className="text-sm">SON DURUM: {isUp ? 'YÜKSELİŞ' : 'DÜŞÜŞ'}</span>
                </div>
              )}
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                  <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900}} />
                  <Line type="monotone" dataKey="net" stroke="#2563eb" strokeWidth={5} dot={{ r: 6, fill: '#2563eb', strokeWidth: 3, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* AJANDA */}
          <div className="space-y-6 text-left">
             <div className="flex items-center justify-between px-4">
                <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                  <CalendarIcon size={24} className="text-blue-600" /> Günlük Program
                </h3>
                <Button onClick={() => {setIsModalOpen(true); setActiveStep(1);}} className="bg-blue-600 hover:bg-slate-900 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest px-8 h-14 shadow-xl">GÖREV ATA</Button>
             </div>
             <div className="space-y-8">
                {Object.keys(tasksByDate).length > 0 ? Object.keys(tasksByDate).map(date => (
                  <div key={date} className="space-y-4">
                     <span className="px-5 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-full uppercase tracking-widest">{date}</span>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {tasksByDate[date].map((t, i) => (
                         <Card key={i} className="p-6 rounded-[2rem] border-none shadow-sm bg-white hover:shadow-2xl transition-all">
                            <h4 className="text-[11px] font-black uppercase text-slate-900 italic mb-2">{t.topic_name}</h4>
                            <div className="flex items-center gap-3 text-[9px] font-bold uppercase text-slate-400">
                               <span className="flex items-center gap-1"><Hash size={12}/> {t.target_questions} Soru</span>
                            </div>
                         </Card>
                       ))}
                     </div>
                  </div>
                )) : <div className="text-center py-20 bg-white rounded-[3rem] opacity-30 font-black italic uppercase text-xs">HENÜZ PLAN YAPILMADI</div>}
             </div>
          </div>
        </div>

        {/* SAĞ PANEL: HAFTALIK SORU TRENDİ */}
        <Card className="p-8 rounded-[3rem] border-none shadow-sm bg-white h-fit sticky top-10">
           <h3 className="text-lg font-black italic uppercase tracking-tighter mb-8 text-left">Soru Trendi</h3>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[{n:'Pt',s:200},{n:'Sa',s:150},{n:'Çş',s:300},{n:'Pş',s:250},{n:'Cu',s:400}]}>
                    <Bar dataKey="s" fill="#2563eb" radius={[10, 10, 0, 0]} />
                    <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </Card>
      </div>

      {/* MÜFREDAT MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 relative animate-in zoom-in duration-300 flex flex-col text-left">
              <Button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-900 p-0 shadow-none border-none"><X size={24}/></Button>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-10 text-slate-900">{activeStep === 1 ? "1. DERS SEÇ" : "2. DETAYLAR"}</h2>
              {activeStep === 1 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {filteredSubjects.map((sub) => (
                     <div key={sub.id} onClick={() => {setSelectedSubject(sub); setActiveStep(2);}} className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-transparent hover:border-blue-600 hover:bg-white cursor-pointer transition-all flex flex-col items-center">
                        <span className="text-4xl mb-4">{sub.icon}</span>
                        <span className="text-[11px] font-black uppercase text-slate-900">{sub.name}</span>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <input type="date" className="h-16 bg-slate-50 rounded-[1.5rem] px-8 font-black" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)} />
                      <select className="h-16 bg-slate-50 rounded-[1.5rem] px-8 font-black text-[10px] uppercase" onChange={(e) => setSelectedTopic(e.target.value)}>
                        <option value="">KONU SEÇİN...</option>
                        {selectedSubject?.topics.map((t: string) => <option key={t} value={t}>{t}</option>)}
                      </select>
                   </div>
                   <input type="number" className="w-full h-16 bg-slate-50 rounded-[1.5rem] px-8 font-black text-center" value={qCount} onChange={(e)=>setQCount(e.target.value)} placeholder="Soru Sayısı" />
                   <Button onClick={handleAddTask} className="w-full h-16 bg-slate-900 hover:bg-blue-600 text-white rounded-[1.8rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl transition-all">GÖREVİ PLANLA</Button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
