"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const schema = z.object({
  title: z.string().min(1, "Requis"),
  service_date: z.string().min(1, "Requis"),
  start_time: z.string().min(1, "Requis"),
  arrival_time: z.string().optional(),
  location: z.string().optional(),
  spiritual_theme: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateServiceButton() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setServerError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
    const { error } = await supabase.from("services").insert({
      ...data,
      organization_id: profile?.organization_id,
      created_by: user.id,
      arrival_time: data.arrival_time || null,
      location: data.location || null,
      spiritual_theme: data.spiritual_theme || null,
      notes: data.notes || null,
    });
    if (error) { setServerError(error.message); return; }
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-warmth-500 hover:bg-warmth-600 text-white rounded-xl gap-1.5"
      >
        <Plus className="w-4 h-4" />
        Créer un service
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="font-display">Nouveau service</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Titre</Label>
              <Input placeholder="Culte du dimanche" className="rounded-xl" {...register("title")} />
              {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" className="rounded-xl" {...register("service_date")} />
                {errors.service_date && <p className="text-red-500 text-xs">{errors.service_date.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Heure</Label>
                <Input type="time" className="rounded-xl" {...register("start_time")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Heure d&apos;arrivée (optionnel)</Label>
              <Input type="time" className="rounded-xl" {...register("arrival_time")} />
            </div>
            <div className="space-y-1.5">
              <Label>Lieu (optionnel)</Label>
              <Input placeholder="Salle principale" className="rounded-xl" {...register("location")} />
            </div>
            <div className="space-y-1.5">
              <Label>Thème spirituel (optionnel)</Label>
              <Input placeholder="L'unité" className="rounded-xl" {...register("spiritual_theme")} />
            </div>
            {serverError && (
              <p className="text-red-500 text-xs text-center">{serverError}</p>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-warmth-500 hover:bg-warmth-600 text-white rounded-xl h-11"
            >
              {isSubmitting ? "Création…" : "Créer le service"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
