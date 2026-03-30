'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, BookOpen, BarChart3, Settings, LogOut, Menu 
} from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const supabase = createClient();

  const menuItems = [
    { name: 'Öğrencilerim', href: '/coach', icon: Users },
    { name: 'Günlük Takip', href: '/coach/daily', icon: BookOpen },
    { name: 'Raporlar', href: '/coach/reports', icon: BarChart3 },
    { name: 'Ayarlar', href: '/coach/settings', icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Çıkış hatası:", error);
    }
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div className={`bg-white border-r border-slate-200 w-72 flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 z-50`}>
        
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-center mb-2">
            <Image 
              src="/logo.png" 
              alt="Göksel Atak Eğitim Kurumları" 
              width={200} 
              height={65}
              priority
              className="mx-auto"
            />
          </div>
          <p className="text-center text-xs text-slate-500 mt-2">Koç Paneli</p>
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
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <LogOut size={20} />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <div className="font-semibold text-slate-900">Koç Paneli</div>
        </header>

        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}