"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Play, Pause, RotateCcw, Coffee, BookOpen, ChevronLeft } from "lucide-react";
import Link from "next/link";

const POMODORO_SESSIONS = [
  { work: 25, break: 5, label: "25-5" },
  { work: 30, break: 5, label: "30-5" },
  { work: 35, break: 5, label: "35-5" },
  { work: 40, break: 10, label: "40-10" },
  { work: 50, break: 10, label: "50-10" },
  { work: 60, break: 15, label: "60-15" },
];

export default function PomodoroPage() {
  const [selectedSession, setSelectedSession] = useState(POMODORO_SESSIONS[0]);
  const [timeLeft, setTimeLeft] = useState(selectedSession.work * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleComplete = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    const audio = new Audio("https://mixkit.co");
    audio.play().catch(() => {});

    if (!isBreak) {
      alert("Çalışma bitti! Mola zamanı.");
      setIsBreak(true);
      setTimeLeft(selectedSession.break * 60);
    } else {
      alert("Mola bitti! Hadi derse.");
      setIsBreak(false);
      setTimeLeft(selectedSession.work * 60);
    }
  }, [isBreak, selectedSession.break, selectedSession.work]);

  useEffect(() => {
    let completeTimer: ReturnType<typeof setTimeout> | null = null;

    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      completeTimer = setTimeout(() => {
        handleComplete();
      }, 0);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (completeTimer) clearTimeout(completeTimer);
    };
  }, [handleComplete, isActive, timeLeft]);

  const toggleTimer = () => setIsActive((prev) => !prev);
  
  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(selectedSession.work * 60);
  };

  const changeSession = (session: typeof POMODORO_SESSIONS[0]) => {
    setSelectedSession(session);
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(session.work * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/student" className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors">
          <ChevronLeft size={20} />
          <span>Panele Dön</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden text-center p-8 md:p-12">
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-2xl ${isBreak ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
              {isBreak ? <Coffee size={40} /> : <Timer size={40} />}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {isBreak ? "Dinlenme Zamanı" : "Odaklanma Vakti"}
          </h1>
          <p className="text-slate-500 mb-8">{selectedSession.label} modunda çalışıyorsun</p>

          <div className="text-8xl font-black text-slate-800 mb-10 tracking-tighter font-mono">
            {formatTime(timeLeft)}
          </div>

          <div className="flex justify-center gap-4 mb-12">
            <button 
              onClick={toggleTimer}
              className={`px-8 py-4 rounded-2xl font-bold text-white transition-all shadow-lg ${
                isActive ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              {isActive ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button 
              onClick={resetTimer}
              className="px-8 py-4 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
            >
              <RotateCcw size={24} />
            </button>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {POMODORO_SESSIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => changeSession(s)}
                className={`py-3 px-2 rounded-xl text-sm font-semibold border transition-all ${
                  selectedSession.label === s.label
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
