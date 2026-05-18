"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Mail, Check } from "lucide-react";

const schema = z.object({
  email: z.string().email("Adresse email invalide"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (!error) {
      setEmail(data.email);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warmth-50 px-4">
        <Card className="w-full max-w-sm text-center rounded-2xl shadow-sm">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-spirit-50 flex items-center justify-center">
              <Check className="w-7 h-7 text-spirit-500" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-xl font-semibold text-slate-900">
                Vérifie ta boîte mail 📬
              </h2>
              <p className="text-slate-500 text-sm">
                On a envoyé un lien de connexion à{" "}
                <span className="font-medium text-slate-700">{email}</span>
              </p>
              <p className="text-slate-400 text-xs mt-4">
                Pas reçu ? Vérifie les spams ou{" "}
                <button
                  className="text-warmth-600 underline"
                  onClick={() => setSent(false)}
                >
                  renvoie un lien
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-warmth-50 px-4">
      <Card className="w-full max-w-sm rounded-2xl shadow-sm">
        <CardHeader className="pb-2 pt-8">
          <div className="text-center space-y-2">
            <h1 className="font-display text-3xl font-bold text-slate-900">
              Crew
            </h1>
            <p className="text-slate-500 text-sm">
              Bienvenue dans ton équipe 🙌
            </p>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                Ton adresse email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="prenom@exemple.com"
                autoComplete="email"
                className="rounded-xl"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-warmth-500 hover:bg-warmth-600 text-white rounded-xl h-11 font-medium"
              disabled={isSubmitting}
            >
              <Mail className="w-4 h-4 mr-2" />
              {isSubmitting ? "Envoi…" : "Recevoir mon lien de connexion"}
            </Button>
            <p className="text-center text-xs text-slate-400">
              Pas de mot de passe — juste un lien sécurisé ✨
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
