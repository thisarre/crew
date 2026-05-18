import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { full_name, email, role, organization_id } = await request.json();

  // Vérifie que l'appelant est bien admin/leader
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!caller || !["admin", "leader"].includes(caller.role ?? "")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Client admin (service role)
  const adminSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Invite l'utilisateur par email
  const { data: invited, error } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Crée le profil immédiatement
  await adminSupabase.from("profiles").insert({
    id: invited.user.id,
    full_name,
    email,
    role,
    organization_id,
  });

  return NextResponse.json({ ok: true });
}
