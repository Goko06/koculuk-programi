'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen, Calendar, TrendingUp,
  ChevronRight, GraduationCap,
  Target, Timer, Play, Pause, RotateCcw, MessageCircle,
  LogOut, Sparkles, School, Bell, CheckCircle2, Info, Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const SESSIONS = [
  { work: 25, break: 5, label: "25-5" },
  { work: 30, break: 5, label: "30-5" },
  { work: 40, break: 10, label: "40-10" },
  { work: 60, break: 15, label: "60-15" },
];

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [target, setTarget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [coachNote, setCoachNote] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pomodoro States
  const [selected, setSelected] = useState(SESSIONS[0]);
  const [timeLeft, setTimeLeft] = useState(SESSIONS[0].work * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push('/login');

        // BÜTÜN VERİLERİ TEK SEFERDE ÇEKİYORUZ (profiles içindeki notes dahil)
        const [profileRes, targetRes, notifRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('student_targets').select('*').eq('student_id', user.id).maybeSingle(),
          supabase.from('programs').select('*').eq('student_id', user.id).order('created_at', { ascending: false }).limit(5)
        ]);

        if (profileRes.data) {
          setProfile(profileRes.data);
          // Koçun notunu profil verisinden alıyoruz
          setCoachNote(profileRes.data.notes || null);
        }
        if (targetRes.data) setTarget(targetRes.data);
        if (notifRes.data) setNotifications(notifRes.data);

      } catch (error) {
        console.error("Dashboard hatası:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [supabase, router]);

  // Pomodoro Timer
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else { if (timerRef.current) clearInterval(timerRef.current); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft]);

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  if (loading) return <div className="h-screen flex items-center justify-center bg-white font-black text-blue-600 animate-pulse uppercase tracking-[0.3em] italic">YÜKLENİYOR...</div>;

  const classLevel = profile?.class_level?.toString() || "";
  const isLGS = ["5", "6", "7", "8"].includes(classLevel);
  const displayName = profile?.full_name || "Öğrenci";

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-[#FDFDFD] min-h-screen pb-24 font-sans text-slate-900">
      
      {/* ÜST BAR */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative z-50">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-blue-100 uppercase italic">{displayName.charAt(0)}</div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none mb-1 italic">Selam, <span className="text-blue-600">{displayName}</span> <Sparkles className="inline text-amber-400" size={20} /></h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">{classLevel}. SINIF PANELİ</p>
          </div>
        </div>
        <Button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} variant="ghost" className="rounded-2xl h-12 px-5 font-black text-[10px] uppercase text-slate-400 hover:text-red-600 transition-all italic"><LogOut size={18} /></Button>
      </div>

      {/* KOÇ DEĞERLENDİRMESİ - VERİ YOKSA BİLE İSKELET OLARAK GÖRÜNÜR */}
      <Card className={`p-10 rounded-[3.5rem] relative overflow-hidden transition-all duration-500 border-none shadow-2xl ${coachNote ? 'bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-blue-500/20' : 'bg-slate-50 border-2 border-dashed border-slate-200'}`}>
        <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
          <MessageCircle size={220} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-2 rounded-xl backdrop-blur-md ${coachNote ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-400'}`}>
              <Star className={coachNote ? 'fill-amber-300 text-amber-300' : ''} size={24} />
            </div>
            <span className={`text-[11px] font-black uppercase tracking-[0.4em] italic ${coachNote ? 'text-blue-100' : 'text-slate-400'}`}>
              Koçunun Haftalık Değerlendirmesi
            </span>
          </div>
          <p className={`text-xl md:text-2xl font-bold italic leading-relaxed tracking-tight max-w-4xl ${!coachNote && 'text-slate-300'}`}>
            {coachNote ? `"${coachNote}"` : "Henüz bir değerlendirme girilmedi. Koçun not yazdığında anlık olarak burada görünecek."}
          </p>
        </div>
      </Card>

      {/* HEDEF KARTI */}
      <Card onClick={() => router.push('/student/target')} className="rounded-[3.5rem] bg-slate-900 p-10 text-white relative overflow-hidden shadow-2xl cursor-pointer group transition-all">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className={`p-6 rounded-[2rem] shadow-2xl transition-transform group-hover:scale-110 duration-500 ${isLGS ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}>{isLGS ? <School size={44} /> : <GraduationCap size={44} />}</div>
            <div>
              <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] mb-2 italic">{isLGS ? "HEDEFLEDİĞİN LİSE" : "HEDEFLEDİĞİN ÜNİVERSİTE"}</p>
              <h2 className="text-3xl font-black tracking-tight uppercase mb-1 italic leading-tight">{target?.university_name || "HEDEFİNİ BELİRLE"}</h2>
              <p className="text-sm font-bold text-slate-400 italic">{target?.department_name || "Bugün attığın adımlar geleceğini şekillendirir."}</p>
            </div>
          </div>
          <ChevronRight className="text-white/10 group-hover:text-white hidden md:block transition-all transform group-hover:translate-x-2" size={48} />
        </div>
      </Card>

      {/* ANA MODÜLLER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* PROGRAMIM */}
        <Card onClick={() => router.push('/student/program')} className="rounded-[3rem] bg-white p-9 cursor-pointer hover:shadow-2xl transition-all border border-slate-100 group relative overflow-hidden min-h-[320px] flex flex-col justify-between">
          <div className="relative z-10">
            <div className="p-5 bg-blue-50 text-blue-600 rounded-[1.8rem] w-fit mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm shadow-blue-100"><Calendar size={36} /></div>
            <h3 className="text-2xl font-black text-slate-900 uppercase italic mb-4 tracking-tighter">Programım</h3>
            <p className="text-xs font-bold text-slate-400 leading-relaxed italic">Haftalık planını yönet, ödevlerini tamamla.</p>
          </div>
          <ChevronRight className="absolute bottom-8 right-8 text-slate-200 group-hover:text-blue-600 transition-colors" size={28} />
        </Card>

        {/* KONU TAKİBİ */}
        <Card onClick={() => router.push('/student/curriculum')} className="rounded-[3rem] bg-white p-9 cursor-pointer hover:shadow-2xl transition-all border border-slate-100 group relative overflow-hidden min-h-[320px] flex flex-col justify-between">
          <div className="relative z-10">
            <div className="p-5 bg-orange-50 text-orange-600 rounded-[1.8rem] w-fit mb-8 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm shadow-orange-100"><BookOpen size={36} /></div>
            <h3 className="text-2xl font-black text-slate-900 uppercase italic mb-4 tracking-tighter">Konu Takibi</h3>
            <p className="text-xs font-bold text-slate-400 leading-relaxed italic">Eksik konularını tespit et ve başarını izle.</p>
          </div>
          <ChevronRight className="absolute bottom-8 right-8 text-slate-200 group-hover:text-orange-600 transition-colors" size={28} />
        </Card>

        {/* GÜNLÜK RAPOR */}
        <Card onClick={() => router.push('/student/daily')} className="rounded-[3rem] bg-white p-9 cursor-pointer hover:shadow-2xl transition-all border border-slate-100 group relative overflow-hidden min-h-[320px] flex flex-col justify-between">
          <div className="relative z-10">
            <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[1.8rem] w-fit mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm shadow-emerald-100"><TrendingUp size={36} /></div>
            <h3 className="text-2xl font-black text-slate-900 uppercase italic mb-4 tracking-tighter">Günlük Rapor</h3>
            <p className="text-xs font-bold text-slate-400 leading-relaxed italic">Bugünkü performansını sisteme işle.</p>
          </div>
          <ChevronRight className="absolute bottom-8 right-8 text-slate-200 group-hover:text-emerald-600 transition-colors" size={28} />
        </Card>

        {/* POMODORO WIDGET */}
        <Card className="rounded-[3rem] bg-blue-50/40 border-none p-8 relative overflow-hidden min-h-[320px]">
          <div className="relative z-10 flex flex-col items-center justify-between h-full">
            <div className="flex justify-between w-full items-center">
              <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm"><Timer size={24} /></div>
              <button onClick={() => router.push('/student/pomodoro')} className="text-[10px] font-black text-blue-600 bg-white px-4 py-2 rounded-full shadow-sm hover:bg-blue-600 hover:text-white transition-all italic uppercase tracking-tighter">TÜMÜ</button>
            </div>
            <div className="text-5xl font-black text-slate-800 font-mono tracking-tighter tabular-nums leading-none">{formatTime(timeLeft)}</div>
            <div className="flex gap-4">
              <button onClick={() => setIsActive(!isActive)} className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center transition-all shadow-lg ${isActive ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-blue-600 text-white shadow-blue-200'}`}>{isActive ? <Pause size={28} /> : <Play size={28} className="ml-1" />}</button>
              <button onClick={() => { setIsActive(false); setTimeLeft(selected.work * 60); }} className="w-14 h-14 rounded-[1.2rem] bg-white text-slate-400 border border-slate-100 flex items-center justify-center shadow-sm hover:text-blue-600 transition-all"><RotateCcw size={24} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full mt-2">
              {SESSIONS.slice(0, 3).map(s => (
                <button key={s.label} onClick={() => { setSelected(s); setTimeLeft(s.work * 60); setIsActive(false); }} className={`text-[9px] font-black py-2.5 rounded-xl border transition-all uppercase ${selected.label === s.label ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'}`}>{s.label}</button>
              ))}
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
