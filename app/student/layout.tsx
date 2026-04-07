'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, BookOpen, Target, BarChart3, User, LogOut, Menu, Calendar, Settings 
} from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Menü öğelerini güncelledik
  const menuItems = [
    { name: 'Dashboard', href: '/student', icon: Home },
    { name: 'Çalışma Programım', href: '/student/program', icon: Calendar },
    { name: 'Günlük Çalışma', href: '/student/daily', icon: BookOpen },
    { name: 'Deneme Girişi', href: '/student/exam', icon: Target },
    { name: 'İlerlemem', href: '/student/progress', icon: BarChart3 },
    { name: 'Profil & Ayarlar', href: '/student/settings', icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div className={`bg-white border-r border-slate-200 w-72 transition-all duration-300 fixed inset-y-0 left-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0 lg:flex-shrink-0 z-50`}>
        
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-center mb-2">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={220} 
              height={70}
              priority
              style={{ height: 'auto' }}
              className="mx-auto"
            />
          </div>
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Eğitim Koçluk Sistemi</p>
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
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-8 left-6 right-6">
          <div className="mb-4 px-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            {user && (
              <div className="overflow-hidden">
                <p className="font-bold text-slate-900 text-xs truncate">{user.email}</p>
                <p className="text-[10px] text-blue-600 font-bold uppercase mt-0.5">Öğrenci Paneli</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <LogOut size={20} />
            Güvenli Çıkış
          </button>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-bold text-slate-900 leading-none">Hoş geldin!</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Öğrenci Dashboard</p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-100">
              {user?.email?.[0]?.toUpperCase() || 'Ö'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8 bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
