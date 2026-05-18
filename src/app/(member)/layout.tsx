import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MemberNav from "@/components/member/MemberNav";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, preferred_name, full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  // Redirige les admins/leaders vers l'espace admin
  if (profile.role === "admin" || profile.role === "leader") {
    redirect("/admin/services");
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <main className="flex-1 pb-20">{children}</main>
      <MemberNav />
    </div>
  );
}
