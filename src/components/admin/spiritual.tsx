'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  IconCheck,
  IconChevronRight,
  IconCopy,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSparkles,
} from '@tabler/icons-react';

import { BottomSheet } from '@/components/shared/bottom-sheet';
import type { SpiritualSuggestionResult } from '@/lib/ai/spiritual-suggest';
import type { SpiritualRow } from '@/lib/queries/admin';

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_PREMIUM } },
};
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

const HISTORY_COLORS = ['#96D8D0', '#D2B4F1', '#DAF4AA', '#96D8D0'];

const TIME_AGO_FMT = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

function timeAgo(iso: string | null) {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 7) return TIME_AGO_FMT.format(-days, 'day');
  return TIME_AGO_FMT.format(-Math.floor(days / 7), 'week');
}

export function SpiritualBoard({ items }: { items: SpiritualRow[] }) {
  const [current, ...history] = items;
  const [suggestOpen, setSuggestOpen] = useState(false);
  // null = sheet fermée ; 'new' = création manuelle ; SpiritualRow = édition d'une pensée existante
  const [editTarget, setEditTarget] = useState<SpiritualRow | 'new' | null>(null);

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-5 pb-6">
      <motion.header variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-[var(--color-text-secondary)]">
            Console admin
          </p>
          <p className="mt-1 text-[24px] font-bold tracking-[-0.4px] text-ink">Spirituel</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSuggestOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-[12px] font-semibold text-ink transition active:scale-95"
          >
            <IconSparkles size={13} stroke={2.5} />
            Suggérer
          </button>
          <button
            type="button"
            onClick={() => setEditTarget('new')}
            className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[12px] font-semibold text-white transition active:scale-95"
          >
            <IconPlus size={14} stroke={2.5} />
            Publier
          </button>
        </div>
      </motion.header>

      <SpiritualSuggestSheet open={suggestOpen} onClose={() => setSuggestOpen(false)} />
      <SpiritualEditSheet target={editTarget} onClose={() => setEditTarget(null)} />

      {current && (
        <motion.section
          variants={fadeUp}
          className="relative overflow-hidden rounded-[24px] bg-[var(--color-sage)] p-6"
        >
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-ink/[0.04]" />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-ink">
                  <IconSparkles size={12} stroke={2} className="text-[var(--color-sage)]" />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-ink">
                  Publiée cette semaine
                </p>
              </div>
              <span className="rounded-full bg-ink px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.3px] text-[var(--color-sage)]">
                En ligne
              </span>
            </div>
            <p className="text-[18px] font-semibold leading-relaxed text-ink">
              « {current.verse_text} »
            </p>
            <p className="mt-2.5 text-[13px] font-medium text-ink/65">
              {current.verse_reference}
              {current.published_at && ` · publiée ${timeAgo(current.published_at)}`}
            </p>
            <div className="mt-3.5 flex gap-2">
              <button
                type="button"
                onClick={() => setEditTarget(current)}
                className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[12px] font-semibold text-white"
              >
                <IconPencil size={14} stroke={2} />
                Modifier
              </button>
            </div>
          </div>
        </motion.section>
      )}

      <motion.section variants={fadeUp}>
        <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
          Historique
        </p>
      </motion.section>

      <motion.section variants={container} className="space-y-2.5">
        {history.map((item, idx) => (
          <motion.button
            type="button"
            key={item.id}
            variants={fadeUp}
            onClick={() => setEditTarget(item)}
            className="flex w-full items-start gap-3 rounded-[18px] bg-white px-4 py-4 text-left transition active:scale-[0.99]"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: HISTORY_COLORS[idx % HISTORY_COLORS.length] }}
            >
              <IconSparkles size={18} stroke={2} className="text-ink" />
            </div>
            <div className="flex-1">
              <p className="line-clamp-2 text-[13px] font-medium leading-snug text-ink">
                « {item.verse_text} »
              </p>
              <p className="mt-1 text-[11px] font-medium text-[var(--color-text-muted)]">
                {item.verse_reference}
                {item.published_at && ` · publiée ${timeAgo(item.published_at)}`}
              </p>
            </div>
            <IconChevronRight size={16} stroke={2} className="mt-1.5 text-[var(--color-text-secondary)]" />
          </motion.button>
        ))}
        {history.length === 0 && (
          <p className="rounded-[18px] bg-white p-6 text-center text-[13px] text-[var(--color-text-secondary)]">
            Aucune publication dans l&apos;historique.
          </p>
        )}
      </motion.section>
    </motion.div>
  );
}

function SpiritualEditSheet({
  target,
  onClose,
}: {
  target: SpiritualRow | 'new' | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const isCreate = target === 'new';
  const item = target && target !== 'new' ? target : null;
  const open = target !== null;
  const [verseText, setVerseText] = useState('');
  const [verseReference, setVerseReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recherche biblique
  const [bibleQuery, setBibleQuery] = useState('');
  const [bibleResults, setBibleResults] = useState<{ reference: string; text: string }[]>([]);
  const [bibleLoading, setBibleLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setVerseText(item?.verse_text ?? '');
      setVerseReference(item?.verse_reference ?? '');
      setError(null);
      setBibleQuery('');
      setBibleResults([]);
    }
  }, [open, item]);

  // Recherche débouncée
  useEffect(() => {
    const q = bibleQuery.trim();
    if (q.length < 2) {
      setBibleResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setBibleLoading(true);
      fetch(`/api/bible/search?q=${encodeURIComponent(q)}`, {
        credentials: 'same-origin',
        signal: controller.signal,
      })
        .then(async res => {
          const body = await res.json();
          if (body.ok) setBibleResults(body.results ?? []);
        })
        .catch(() => {})
        .finally(() => !controller.signal.aborted && setBibleLoading(false));
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [bibleQuery]);

  const pickVerse = (r: { reference: string; text: string }) => {
    setVerseText(r.text);
    setVerseReference(r.reference);
    setBibleQuery('');
    setBibleResults([]);
  };

  const handleSave = async () => {
    if (saving || !verseText.trim() || !verseReference.trim()) return;
    setError(null);
    setSaving(true);
    try {
      const url = isCreate ? '/api/spiritual-content' : `/api/spiritual-content/${item!.id}`;
      const method = isCreate ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ verseText: verseText.trim(), verseReference: verseReference.trim() }),
      });
      const body = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
      if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      subtitle={isCreate ? 'Nouvelle pensée' : 'Édition'}
      title={isCreate ? 'Publier une pensée' : 'Modifier la pensée'}
      footer={
        <div className="space-y-2">
          {error && (
            <p className="rounded-[10px] bg-[var(--color-error-bg)] p-2 text-[11px] font-medium text-[var(--color-error-fg)]">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !verseText.trim() || !verseReference.trim()}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-ink py-3 text-[13px] font-bold text-white active:scale-[0.98] disabled:opacity-50"
          >
            <IconCheck size={14} stroke={2} />
            {saving ? 'Enregistrement...' : isCreate ? 'Publier' : 'Enregistrer'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
            Chercher dans la Bible
          </label>
          <div className="relative">
            <IconSearch
              size={15}
              stroke={2}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              type="text"
              value={bibleQuery}
              onChange={e => setBibleQuery(e.target.value)}
              placeholder="Ex : unité, Jean 3, paix..."
              className="w-full rounded-[14px] bg-white py-3 pl-10 pr-4 text-[14px] font-medium text-ink outline-none focus:ring-2 focus:ring-ink"
            />
          </div>
          {(bibleResults.length > 0 || bibleLoading) && (
            <div className="mt-2 space-y-1.5">
              {bibleLoading && bibleResults.length === 0 && (
                <p className="px-1 text-[11px] text-[var(--color-text-secondary)]">Recherche...</p>
              )}
              {bibleResults.map(r => (
                <button
                  key={r.reference}
                  type="button"
                  onClick={() => pickVerse(r)}
                  className="block w-full rounded-[12px] bg-white p-3 text-left transition active:scale-[0.99]"
                >
                  <p className="text-[11px] font-bold text-ink">{r.reference}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] text-[var(--color-text-secondary)]">{r.text}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
            Verset
          </label>
          <textarea
            value={verseText}
            onChange={e => setVerseText(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-[14px] bg-white px-4 py-3 text-[14px] font-medium leading-relaxed text-ink outline-none focus:ring-2 focus:ring-ink"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
            Référence
          </label>
          <input
            type="text"
            value={verseReference}
            onChange={e => setVerseReference(e.target.value)}
            placeholder="Ex : 1 Pierre 4:10"
            className="w-full rounded-[14px] bg-white px-4 py-3 text-[14px] font-medium text-ink outline-none focus:ring-2 focus:ring-ink"
          />
        </div>
      </div>
    </BottomSheet>
  );
}

function SpiritualSuggestSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [suggestion, setSuggestion] = useState<SpiritualSuggestionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const fetchSuggestion = React.useCallback(() => {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    const controller = new AbortController();
    fetch('/api/ai/spiritual-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: controller.signal,
    })
      .then(async res => {
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? 'unknown_error');
        setSuggestion({
          verseText: json.verseText,
          verseReference: json.verseReference,
          shortReflection: json.shortReflection,
          suggestedTitle: json.suggestedTitle,
        });
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'unknown_error');
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!open) {
      setSuggestion(null);
      setError(null);
      setCopied(false);
      return;
    }
    return fetchSuggestion();
  }, [open, fetchSuggestion]);

  const handleCopy = async () => {
    if (!suggestion) return;
    const text = `« ${suggestion.verseText} »\n${suggestion.verseReference}\n\n${suggestion.shortReflection}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const handlePublish = async () => {
    if (!suggestion || publishing) return;
    setPublishError(null);
    setPublishing(true);
    try {
      const res = await fetch('/api/spiritual-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verseText: suggestion.verseText,
          verseReference: suggestion.verseReference,
          title: suggestion.suggestedTitle,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error ?? 'publish_failed');
      setPublished(true);
      router.refresh();
      setTimeout(() => {
        onClose();
        setPublished(false);
      }, 1500);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      subtitle="Suggestion IA"
      title="Pensée de la semaine"
      footer={
        suggestion && (
          <div className="space-y-2">
            {publishError && (
              <p className="rounded-[10px] bg-[var(--color-error-bg)] p-2 text-[11px] font-medium text-[var(--color-error-fg)]">
                {publishError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={fetchSuggestion}
                disabled={publishing}
                className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-3.5 py-3 text-[12px] font-semibold text-ink disabled:opacity-60"
              >
                <IconRefresh size={13} stroke={2} />
                Une autre
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={publishing}
                className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-3.5 py-3 text-[12px] font-semibold text-ink disabled:opacity-60"
              >
                {copied ? <IconCheck size={13} stroke={2} /> : <IconCopy size={13} stroke={2} />}
                {copied ? 'Copié' : 'Copier'}
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing || published}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink py-3 text-[13px] font-bold text-white active:scale-[0.98] disabled:opacity-60"
              >
                <IconCheck size={14} stroke={2} />
                {published ? 'Publié' : publishing ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </div>
        )
      }
    >
      {loading && (
        <div className="space-y-2 py-2">
          <div className="h-3 w-3/4 animate-pulse rounded-full bg-[var(--color-border-soft)]" />
          <div className="h-3 w-1/2 animate-pulse rounded-full bg-[var(--color-border-soft)]" />
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-[var(--color-border-soft)]" />
        </div>
      )}
      {error && !loading && (
        <p className="rounded-[14px] bg-[var(--color-error-bg)] p-3 text-[12px] font-medium text-[var(--color-error-fg)]">
          Impossible de générer : {error}
        </p>
      )}
      {suggestion && !loading && (
        <div className="space-y-3 rounded-[14px] bg-[var(--color-sage)] p-4">
          <p className="text-[16px] font-semibold leading-relaxed text-ink">« {suggestion.verseText} »</p>
          <p className="text-[12px] font-medium text-ink/70">{suggestion.verseReference}</p>
          <p className="mt-2 text-[13px] italic leading-relaxed text-ink/80">{suggestion.shortReflection}</p>
        </div>
      )}
    </BottomSheet>
  );
}
