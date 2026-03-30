'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, BookOpen, Target, BarChart3, User, LogOut, Menu } from 'lucide-react';

export default function StudentLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { name: 'Dashboard', href: '/student', icon: Home },
    { name: 'Günlük Çalışma', href: '/student/daily', icon: BookOpen },
    { name: 'Deneme Girişi', href: '/student/exam', icon: Target },
    { name: 'İlerlemem', href: '/student/progress', icon: BarChart3 },
    { name: 'Profil', href: '/student/profile', icon: User },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div className={`bg-white border-r border-slate-200 w-72 flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Koçluk</h1>
              <p className="text-xs text-slate-500">Eğitim Koçluğu</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors font-medium"
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-8 left-6 right-6">
          <button className="flex w-full items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut size={20} />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Ana İçerik Alanı */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold">Ahmet Yılmaz</p>
              <p className="text-sm text-slate-500">12. Sınıf • YKS Sayısal</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
              AY
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}