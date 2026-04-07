import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Environment variables kontrolü
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing Supabase environment variables", { supabaseUrl: !!supabaseUrl, serviceRoleKey: !!supabaseServiceRoleKey });
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const url = new URL(request.url);
  const coachId = url.searchParams.get('coachId');

  if (!coachId) {
    return NextResponse.json({ error: 'coachId is required' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(coachId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const coachUser = (data as any)?.user ?? data;
  const logo = coachUser?.user_metadata?.logo ?? null;
  const full_name = coachUser?.user_metadata?.full_name ?? null;

  return NextResponse.json({ logo, full_name });
}
