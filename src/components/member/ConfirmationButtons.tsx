"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = { assignmentId: string; currentStatus: string };

export default function ConfirmationButtons({ assignmentId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: "confirmed" | "declined") {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("assignments")
      .update({ status: newStatus, responded_at: new Date().toISOString() })
      .eq("id", assignmentId);
    setStatus(newStatus);
    setLoading(false);
  }

  if (status === "confirmed") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 bg-spirit-50 text-spirit-700 rounded-2xl py-3.5 font-semibold text-sm"
        >
          <CheckCircle className="w-4 h-4" />
          Tu es confirmé pour ce service 🙌
        </motion.div>
      </AnimatePresence>
    );
  }

  if (status === "declined") {
    return (
      <div className="text-center py-2">
        <p className="text-slate-400 text-sm">Tu as décliné ce service.</p>
        <button
          className="text-warmth-600 text-sm font-medium mt-1 underline underline-offset-2"
          onClick={() => updateStatus("confirmed")}
        >
          Finalement disponible ?
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => updateStatus("confirmed")}
        disabled={loading}
        className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-spirit-500 text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-60"
      >
        <Check className="w-4 h-4 stroke-[2.5]" />
        Je confirme
      </button>
      <button
        onClick={() => updateStatus("declined")}
        disabled={loading}
        className="flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-slate-200 text-slate-500 font-semibold text-sm transition-all active:scale-95 disabled:opacity-60"
      >
        <X className="w-4 h-4" />
        Pas dispo
      </button>
    </div>
  );
}
