import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, preferred_name, full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.role === "member") redirect("/");

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <AdminNav profile={profile} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  );
}
