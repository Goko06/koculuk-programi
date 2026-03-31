'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client'; // Supabase client'ı import ediyoruz
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Key, Save, ShieldCheck } from 'lucide-react';

export default function StudentSettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Supabase istemcisini burada tanımlıyoruz
  const supabase = createClient();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basit kontroller
    if (newPassword.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Şifreler birbiriyle eşleşmiyor.");
      return;
    }

    try {
      setLoading(true);
      
      // Şifreyi güncelleyen Supabase fonksiyonu
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Şifreniz başarıyla güncellendi!");
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Ayarlar</h1>
        <p className="text-slate-600">Hesap bilgilerinizi ve güvenliğinizi yönetin.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-primary h-5 w-5" />
              <CardTitle>Güvenlik</CardTitle>
            </div>
            <CardDescription>
              Koçunuzun size verdiği geçici şifreyi buradan değiştirebilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Yeni Şifre</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Yeni Şifre (Tekrar)</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full gap-2" 
                disabled={loading}
              >
                {loading ? "Güncelleniyor..." : (
                  <>
                    <Save size={18} /> Şifreyi Güncelle
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-red-50/30">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600 font-medium">
              Dikkat: Şifrenizi değiştirdiğinizde tüm cihazlardaki oturumlarınız açık kalmaya devam edebilir, ancak bir sonraki girişte yeni şifreniz gerekecektir.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
