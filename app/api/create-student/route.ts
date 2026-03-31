import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // DEBUG: Terminale (VS Code altına) bak, hangisi false çıkacak?
  console.log("--- ENV KONTROLÜ ---");
  console.log("URL Mevcut mu?:", !!supabaseUrl);
  console.log("Key Mevcut mu?:", !!supabaseServiceKey);
  console.log("--------------------");

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ 
      error: "Sunucu anahtarları eksik. Lütfen .env.local dosyasını ve terminali kontrol edin." 
    }, { status: 500 });
  }

  try {
    const { email, password, full_name, coach_id, grade_level } = await req.json();

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name },
      email_confirm: true
    });

    if (authError) throw authError;

    const { error: dbError } = await supabaseAdmin
      .from('students')
      .insert({
        id: authData.user.id,
        full_name,
        email,
        coach_id,
        grade_level,
        tenant_id: '00000000-0000-0000-0000-000000000000'
      });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Hata Detayı:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
