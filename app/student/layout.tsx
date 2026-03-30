'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, BookOpen, Target, BarChart3, User, LogOut, Menu 
} from 'lucide-react';
import Image from 'next/image';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/student', icon: Home },
    { name: 'Günlük Çalışma', href: '/student/daily', icon: BookOpen },
    { name: 'Deneme Girişi', href: '/student/exam', icon: Target },
    { name: 'İlerlemem', href: '/student/progress', icon: BarChart3 },
    { name: 'Profil', href: '/student/profile', icon: User },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div className={`bg-white border-r border-slate-200 w-72 flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 z-50`}>
        
        {/* Logo Bölümü */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-center mb-2">
            <Image 
              src="/logo.png" 
              alt="Göksel Atak Eğitim Kurumları" 
              width={220} 
              height={70}
              priority
              className="mx-auto"
            />
          </div>
          <p className="text-center text-xs text-slate-500 mt-1">Eğitim Koçluk Programı</p>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
                  active 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-8 left-6 right-6">
          <button className="flex w-full items-center gap-3 px-4 py-3.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium">
            <LogOut size={20} />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-slate-900">Ahmet Yılmaz</p>
              <p className="text-sm text-slate-500">12. Sınıf • YKS Sayısal</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
              AY
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}