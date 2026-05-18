"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-spirit-600 text-sm font-medium"
        >
          <CheckCircle className="w-4 h-4" />
          Tu es confirmé 🙌
        </motion.div>
      </AnimatePresence>
    );
  }

  if (status === "declined") {
    return (
      <p className="text-slate-400 text-sm">
        Tu as décliné ce service.{" "}
        <button
          className="text-warmth-600 underline"
          onClick={() => updateStatus("confirmed")}
        >
          Finalement disponible ?
        </button>
      </p>
    );
  }

  return (
    <div className="flex gap-3">
      <Button
        onClick={() => updateStatus("confirmed")}
        disabled={loading}
        className="flex-1 bg-spirit-500 hover:bg-spirit-600 text-white rounded-xl h-11"
      >
        <Check className="w-4 h-4 mr-1.5" />
        Je confirme
      </Button>
      <Button
        onClick={() => updateStatus("declined")}
        disabled={loading}
        variant="outline"
        className="flex-1 rounded-xl h-11 border-slate-200 text-slate-500"
      >
        <X className="w-4 h-4 mr-1.5" />
        Pas dispo
      </Button>
    </div>
  );
}
