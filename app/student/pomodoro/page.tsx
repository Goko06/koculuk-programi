'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Play, Pause, RotateCcw, Coffee, 
  Brain, Timer, ArrowLeft, Volume2, 
  VolumeX, Settings2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function PomodoroPage() {
  // Kullanıcı Ayarları (Varsayılan 25/5)
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedSessions, setCompletedSessions] = useState(0);
  
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sayfa yüklendiğinde varsa eski ayarları getir
  useEffect(() => {
    const savedWork = localStorage.getItem('pomodoro_work');
    const savedBreak = localStorage.getItem('pomodoro_break');
    if (savedWork) {
        setWorkDuration(Number(savedWork));
        setTimeLeft(Number(savedWork) * 60);
    }
    if (savedBreak) setBreakDuration(Number(savedBreak));
  }, []);

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
      setTimeLeft(breakDuration * 60);
    } else {
      toast.info("Dinlenme bitti, yeni bir maratona hazır mısın? 💪");
      setIsBreak(false);
      setTimeLeft(workDuration * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(workDuration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveAndExit = () => {
    const totalMinutes = completedSessions * workDuration;
    if (totalMinutes === 0) {
       router.back();
       return;
    }
    toast.success(`${totalMinutes} dakika günlük raporuna ekleniyor...`);
    router.push(`/student/daily?pomodoro=${totalMinutes}`);
  };

  // Dinamik Süre Değişimi Fonksiyonları
  const updateWorkDuration = (val: number) => {
    setWorkDuration(val);
    localStorage.setItem('pomodoro_work', val.toString());
    if (!isActive && !isBreak) setTimeLeft(val * 60);
  };

  const updateBreakDuration = (val: number) => {
    setBreakDuration(val);
    localStorage.setItem('pomodoro_break', val.toString());
    if (!isActive && isBreak) setTimeLeft(val * 60);
  };

  const totalTime = isBreak ? breakDuration * 60 : workDuration * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const strokeDashoffset = 911 - (911 * progress) / 100;

  return (
    <div className={`p-4 md:p-8 min-h-screen transition-all duration-1000 font-sans text-white flex flex-col items-center ${isBreak ? 'bg-emerald-600' : 'bg-slate-950'}`}>
      <div className="w-full max-w-2xl space-y-8">
        
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

        {/* SÜRE AYARLARI (Sadece Timer Durmuşken Görünür) */}
        {!isActive && (
          <div className="flex justify-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Çalışma (Dk)</span>
              <input 
                type="number" 
                value={workDuration} 
                onChange={(e) => updateWorkDuration(Number(e.target.value))}
                className="w-20 bg-white/5 border border-white/10 rounded-xl p-2 text-center font-bold outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Mola (Dk)</span>
              <input 
                type="number" 
                value={breakDuration} 
                onChange={(e) => updateBreakDuration(Number(e.target.value))}
                className="w-20 bg-white/5 border border-white/10 rounded-xl p-2 text-center font-bold outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* ANA SAYAÇ */}
        <div className="relative flex flex-col items-center justify-center">
           <div className="relative inline-flex items-center justify-center">
              <svg className="w-[300px] h-[300px] md:w-[380px] md:h-[380px] transform -rotate-90">
                <circle cx="50%" cy="50%" r="145" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                <circle 
                  cx="50%" cy="50%" r="145" stroke="currentColor" strokeWidth="12" fill="transparent" 
                  strokeDasharray={911} 
                  strokeDashoffset={strokeDashoffset} 
                  className={`${isBreak ? 'text-emerald-400' : 'text-blue-500'} transition-all duration-500 ease-linear`}
                  strokeLinecap="round" 
                />
              </svg>
              
              <div className="absolute flex flex-col items-center">
                 <span className="text-7xl md:text-8xl font-black tracking-tighter tabular-nums">
                    {formatTime(timeLeft)}
                 </span>
                 <div className="flex items-center gap-2 mt-2">
                    <Brain className={`${isActive ? 'animate-pulse' : ''} text-white/40`} size={18} />
                    <p className="text-white/30 font-black uppercase tracking-[0.3em] text-[9px]">
                      {isActive ? 'ZİHİN AKTİF' : 'BEKLEMEDE'}
                    </p>
                 </div>
              </div>
           </div>

           {/* KONTROLLER */}
           <div className="flex justify-center items-center gap-6 mt-10">
              <Button 
                onClick={resetTimer}
                variant="ghost" 
                className="w-14 h-14 rounded-full border border-white/10 hover:bg-white/10 text-white/50"
              >
                <RotateCcw size={24} />
              </Button>

              <Button 
                onClick={toggleTimer}
                className={`w-24 h-24 rounded-[2.5rem] shadow-2xl transition-all active:scale-95 flex items-center justify-center ${isActive ? 'bg-white text-slate-900' : 'bg-blue-600 text-white'}`}
              >
                {isActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
              </Button>

              <Button 
                onClick={() => { 
                  const nextState = !isBreak;
                  setIsBreak(nextState); 
                  setTimeLeft(nextState ? breakDuration * 60 : workDuration * 60); 
                  setIsActive(false); 
                }}
                variant="ghost" 
                className="w-14 h-14 rounded-full border border-white/10 hover:bg-white/10 text-white/50"
              >
                {isBreak ? <Brain size={24} /> : <Coffee size={24} />}
              </Button>
           </div>
        </div>

        {/* BAŞARI KARTI */}
        <Card className="rounded-[2.5rem] border-none bg-white/5 backdrop-blur-xl p-8 text-white relative overflow-hidden group shadow-2xl">
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-5">
                 <div className="p-5 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
                    <Timer size={30} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 italic">Bu Oturumdaki Toplam</p>
                    <h3 className="text-3xl font-black">{completedSessions * workDuration} <span className="text-sm font-bold text-blue-400">Dakika</span></h3>
                 </div>
              </div>
              
              <div className="flex flex-col items-center md:items-end">
                 <div className="flex gap-1.5 mb-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${i < (completedSessions % 4 || (completedSessions > 0 ? 4 : 0)) ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`} />
                    ))}
                 </div>
                 <p className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">
                    {completedSessions} Seans Tamamlandı
                 </p>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
