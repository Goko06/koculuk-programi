import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { COACH_ROLE } from '@/lib/roles';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, phone, parentAdminId, logoBase64 } = await request.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const userMetadata: Record<string, unknown> = { role: COACH_ROLE, full_name: fullName };
    if (logoBase64) {
      userMetadata.logo = logoBase64;
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const coachId = authData.user.id;
    const { error: profileError } = await supabaseAdmin.from('profiles').insert([
      {
        id: coachId,
        user_id: coachId,
        full_name: fullName,
        phone_number: phone,
        role: COACH_ROLE,
        coach_id: parentAdminId ?? null,
      },
    ]);

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(coachId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, coachId });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Beklenmeyen hata oluştu.' },
      { status: 500 }
    );
  }
}
