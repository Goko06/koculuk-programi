import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Environment variables kontrolü
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { email, password, fullName, phone, classLevel, branch, coachId } = await request.json();

    // Admin yetkili client (Service Role Key gereklidir)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. Auth Kullanıcısı Oluştur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'student' }
    });

    if (authError) {
      console.error("Auth Error:", authError.message);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const studentId = authData.user.id;

    // 2. Profiles Tablosuna Detayları Yaz
    // HATA ÇÖZÜMÜ: Hem 'id' hem de 'user_id' alanlarına studentId gönderiyoruz.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: studentId,
          user_id: studentId, // Bu satır hatayı çözer
          full_name: fullName,
          phone_number: phone,
          role: 'student',
          class_level: classLevel,
          branch: branch,
          coach_id: coachId
        }
      ]);

    if (profileError) {
      console.error("Profile DB Error:", profileError.message);
      // Profil oluşturulamazsa auth kullanıcısını temizlemek iyi bir pratiktir
      await supabaseAdmin.auth.admin.deleteUser(studentId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Server Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
