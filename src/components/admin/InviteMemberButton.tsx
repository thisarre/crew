"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Check } from "lucide-react";

const schema = z.object({
  full_name: z.string().min(2, "Requis"),
  email: z.string().email("Email invalide"),
  role: z.enum(["member", "leader", "admin"]),
});

type FormData = z.infer<typeof schema>;

export default function InviteMemberButton({ organizationId }: { organizationId: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "member" },
  });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, organization_id: organizationId }),
    });
    if (res.ok) {
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setOpen(false);
        reset();
        router.refresh();
      }, 1500);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-warmth-500 hover:bg-warmth-600 text-white rounded-xl gap-1.5"
      >
        <UserPlus className="w-4 h-4" />
        Inviter
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="font-display">Inviter un membre</DialogTitle>
          </DialogHeader>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 rounded-full bg-spirit-50 flex items-center justify-center">
                <Check className="w-6 h-6 text-spirit-500" />
              </div>
              <p className="text-slate-700 font-medium">Invitation envoyée 🎉</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Nom complet</Label>
                <Input placeholder="Isaac Martin" className="rounded-xl" {...register("full_name")} />
                {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="isaac@email.com" className="rounded-xl" {...register("email")} />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Rôle</Label>
                <Select onValueChange={v => setValue("role", v as "member" | "leader" | "admin")} defaultValue="member">
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membre</SelectItem>
                    <SelectItem value="leader">Leader</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-warmth-500 hover:bg-warmth-600 text-white rounded-xl h-11"
              >
                {isSubmitting ? "Envoi…" : "Envoyer l'invitation"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
