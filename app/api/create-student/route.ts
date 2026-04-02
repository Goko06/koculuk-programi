import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ 
      error: "Sunucu anahtarları eksik." 
    }, { status: 500 });
  }

  try {
    // 1. major alanını request body'den çekiyoruz
    const { email, password, full_name, coach_id, grade_level, major } = await req.json();

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 2. Auth kullanıcısını oluştururken metadata'ya alanı da ekleyebiliriz (opsiyonel)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name, major }, 
      email_confirm: true
    });

    if (authError) throw authError;

    // 3. 'students' tablosuna 'major' (Alan) bilgisini kaydediyoruz
    const { error: dbError } = await supabaseAdmin
      .from('students')
      .insert({
        id: authData.user.id,
        full_name,
        email,
        coach_id,
        grade_level,
        major, // Buraya dikkat: Supabase tablonuzda 'major' kolonu olmalı
        tenant_id: '00000000-0000-0000-0000-000000000000'
      });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Hata Detayı:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
