'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Play, Pause, RotateCcw, Coffee, 
  Brain, Timer, ArrowLeft, Save, 
  Volume2, VolumeX, Sparkles, CheckCircle2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function PomodoroPage() {
  // Timer Ayarları: 25 dk (1500 sn) İş / 5 dk (300 sn) Mola
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedSessions, setCompletedSessions] = useState(0);
  
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sayaç Mantığı
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    if (soundEnabled) {
      const audio = new Audio('https://mixkit.co');
      audio.play().catch(() => console.log("Ses çalınamadı."));
    }

    if (!isBreak) {
      setCompletedSessions(prev => prev + 1);
      toast.success("Müthişsin! Bir odaklanma seansını tamamladın. 🎉");
      setIsBreak(true);
      setTimeLeft(5 * 60); // 5 Dakika Mola
    } else {
      toast.info("Dinlenme bitti, yeni bir maratona hazır mısın? 💪");
      setIsBreak(false);
      setTimeLeft(25 * 60); // 25 Dakika Çalışma
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Rapor Sayfasına Aktar
  const handleSaveAndExit = () => {
    const totalMinutes = completedSessions * 25;
    if (totalMinutes === 0) {
       router.back();
       return;
    }
    toast.success(`${totalMinutes} dakika günlük raporuna ekleniyor...`);
    router.push(`/student/daily?pomodoro=${totalMinutes}`);
  };

  // İlerleme Çemberi Hesaplama
  const totalTime = isBreak ? 5 * 60 : 25 * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const strokeDashoffset = 911 - (911 * progress) / 100;

  return (
    <div className={`p-4 md:p-8 min-h-screen transition-all duration-1000 font-sans text-white flex flex-col items-center ${isBreak ? 'bg-emerald-600' : 'bg-slate-950'}`}>
      <div className="w-full max-w-2xl space-y-12">
        
        {/* ÜST BAR */}
        <div className="flex justify-between items-center bg-white/5 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
          <Button onClick={handleSaveAndExit} variant="ghost" className="text-white hover:bg-white/10 rounded-2xl gap-2 font-black text-xs uppercase tracking-widest">
            <ArrowLeft size={18} /> {completedSessions > 0 ? "Kaydet ve Çık" : "Geri Dön"}
          </Button>
          <div className="flex items-center gap-2">
             <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                {soundEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
             </button>
             <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${isBreak ? 'bg-emerald-400 text-emerald-950' : 'bg-blue-600 text-white'}`}>
                {isBreak ? 'Mola Zamanı' : 'Odaklanma'}
             </div>
          </div>
        </div>

        {/* ANA SAYAÇ TASARIMI */}
        <div className="relative flex flex-col items-center justify-center py-10">
           <div className="relative inline-flex items-center justify-center">
              {/* SVG Dairesel Progress */}
              <svg className="w-[320px] h-[320px] md:w-[400px] md:h-[400px] transform -rotate-90">
                <circle cx="50%" cy="50%" r="145" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                <circle 
                  cx="50%" cy="50%" r="145" stroke="currentColor" strokeWidth="16" fill="transparent" 
                  strokeDasharray={911} 
                  strokeDashoffset={strokeDashoffset} 
                  className={`${isBreak ? 'text-emerald-400' : 'text-blue-500'} transition-all duration-500 ease-linear`}
                  strokeLinecap="round" 
                />
              </svg>
              
              <div className="absolute flex flex-col items-center">
                 <span className="text-8xl md:text-9xl font-black tracking-tighter leading-none tabular-nums">
                    {formatTime(timeLeft)}
                 </span>
                 <div className="flex items-center gap-2 mt-4">
                    <Brain className={`${isActive ? 'animate-pulse' : ''} text-white/40`} size={20} />
                    <p className="text-white/30 font-black uppercase tracking-[0.4em] text-[10px]">
                      {isActive ? 'ZİHİN AKTİF' : 'BEKLEMEDE'}
                    </p>
                 </div>
              </div>
           </div>

           {/* KONTROLLER */}
           <div className="flex justify-center items-center gap-8 mt-12">
              <Button 
                onClick={resetTimer}
                variant="ghost" 
                className="w-16 h-16 rounded-full border border-white/10 hover:bg-white/10 text-white/50 hover:text-white"
              >
                <RotateCcw size={28} />
              </Button>

              <Button 
                onClick={toggleTimer}
                className={`w-28 h-28 rounded-[3rem] shadow-2xl transition-all active:scale-90 flex items-center justify-center ${isActive ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
              >
                {isActive ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}
              </Button>

              <Button 
                onClick={() => { setIsBreak(!isBreak); setTimeLeft(isBreak ? 25 * 60 : 5 * 60); setIsActive(false); }}
                variant="ghost" 
                className="w-16 h-16 rounded-full border border-white/10 hover:bg-white/10 text-white/50 hover:text-white"
              >
                {isBreak ? <Brain size={28} /> : <Coffee size={28} />}
              </Button>
           </div>
        </div>

        {/* BAŞARI KARTI */}
        <Card className="rounded-[3rem] border-none bg-white/5 backdrop-blur-xl p-10 text-white overflow-hidden relative group border border-white/5 shadow-2xl">
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                 <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
                    <Timer size={36} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 italic">Bu Oturumdaki Kazanımın</p>
                    <h3 className="text-4xl font-black">{completedSessions * 25} <span className="text-sm font-bold text-blue-400">Dakika</span></h3>
                 </div>
              </div>
              
              <div className="flex flex-col items-center md:items-end">
                 <div className="flex gap-1 mb-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`w-3 h-3 rounded-full ${i < completedSessions ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-white/10'}`} />
                    ))}
                 </div>
                 <p className="text-[9px] font-black text-white/30 uppercase tracking-tighter">4 Seans Hedefine Kalan: {4 - completedSessions}</p>
              </div>
           </div>
           
           {/* Arka plan dekor */}
           <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full" />
        </Card>

        {/* ALT MOTİVASYON */}
        <div className="text-center pb-10">
           <p className="text-white/20 text-xs font-black uppercase tracking-[0.5em] flex items-center justify-center gap-3">
              <Sparkles size={14} /> derin odaklanma modu <Sparkles size={14} />
           </p>
        </div>

      </div>
    </div>
  );
}
