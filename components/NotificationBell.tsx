'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const safeData = (data ?? []) as NotificationItem[];
    setNotifications(safeData);
    setUnreadCount(safeData.filter((n) => !n.is_read).length);
  }, [supabase]);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      void fetchNotifications();
    }, 0);
    const channel = supabase
      .channel('notif-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, fetchNotifications)
      .subscribe();
    return () => {
      clearTimeout(initTimer);
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, supabase]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    fetchNotifications();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all group">
          <Bell size={22} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-[2rem] border-none shadow-2xl bg-white overflow-hidden z-[100]" align="end">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <h3 className="font-black text-xs uppercase tracking-widest italic font-sans">Bildirimler</h3>
          {unreadCount > 0 && <span className="text-[10px] font-bold bg-blue-600 px-2 py-0.5 rounded-lg">{unreadCount} Yeni</span>}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-bold italic text-xs">Henüz bildirim yok.</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-5 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 relative ${!n.is_read ? 'bg-blue-50/30' : ''}`}>
                {!n.is_read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                <p className="font-black text-slate-900 text-sm mb-1 leading-tight">{n.title}</p>
                <p className="text-xs font-medium text-slate-500 italic leading-relaxed line-clamp-2">{n.message}</p>
                <p className="text-[9px] font-black text-slate-300 uppercase mt-3 tracking-widest">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: tr })}
                </p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
