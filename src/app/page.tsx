import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center space-y-3">
        <h1 className="font-display text-3xl font-bold text-slate-900">
          Crew
        </h1>
        <p className="text-slate-500">
          Tu es connecté 🎉 — Le dashboard arrive en Phase 1.
        </p>
        <p className="text-slate-400 text-sm">{user.email}</p>
      </div>
    </div>
  );
}
