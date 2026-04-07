'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Users, BookOpen, BarChart3, Settings, LogOut, Menu, X 
} from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { isAdminCoach } from '@/lib/roles';

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState('Koçluk Programı');
  const pathname = usePathname();
  const router = useRouter();
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

  useEffect(() => {
    const checkCoachAccess = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData.user;
        if (!user) {
          router.push('/login');
          return;
        }

        setLogoUrl(user.user_metadata?.logo || null);

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, status, full_name')
          .or(`id.eq.${user.id},user_id.eq.${user.id}`)
          .single();

        const status = profile?.status || 'active';
        const isCoachLike = profile?.role === 'coach' || isAdminCoach(profile);
        if (!isCoachLike) {
          router.push('/login');
          return;
        }

        if (status === 'archived' || status === 'deleted') {
          await supabase.auth.signOut();
          router.push('/login');
          return;
        }

        if (profile?.full_name) {
          setPageTitle(`${profile.full_name} Koçluk Programı`);
        }
      } finally {
        setCheckingAccess(false);
      }
    };
    checkCoachAccess();
  }, [router, supabase]);

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  if (checkingAccess) {
    return <div className="h-screen flex items-center justify-center font-black text-blue-600 text-xs uppercase">Erişim kontrol ediliyor...</div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={`bg-white border-r border-slate-200 w-72 transition-all duration-300 fixed inset-y-0 left-0 top-0 h-full ${sidebarOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-full opacity-0 pointer-events-none'} lg:static lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto lg:flex-shrink-0 z-50`}>
        
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Koç Logo"
                className="mx-auto h-[65px] object-contain"
              />
            ) : (
              <Image 
                src="/logo.png" 
                alt="Göksel Atak Eğitim Kurumları" 
                width={200} 
                height={65}
                priority
                className="mx-auto"
              />
            )}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              aria-label="Menüyü kapat"
            >
              <X size={20} />
            </button>
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