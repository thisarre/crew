import type { SupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { ORG_ID } from '@/data/seed';

export type PublishSpiritualInput = {
  organizationId?: string;
  verseText: string;
  verseReference: string;
  title?: string;
  contentType?: 'weekly_thought' | 'service_theme';
  serviceId?: string;
  publishAt?: string; // ISO ; defaults to now
};

export async function publishSpiritualContent(
  client: SupabaseServerClient,
  input: PublishSpiritualInput,
): Promise<{ id: string; publishedAt: string }> {
  const publishedAt = input.publishAt ?? new Date().toISOString();
  const { data, error } = await client
    .from('spiritual_content')
    .insert({
      organization_id: input.organizationId ?? ORG_ID,
      content_type: input.contentType ?? 'weekly_thought',
      title: input.title ?? null,
      verse_text: input.verseText,
      verse_reference: input.verseReference,
      status: 'published',
      published_at: publishedAt,
      service_id: input.serviceId ?? null,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error('spiritual_insert_failed');
  return { id: data.id, publishedAt };
}

export type UpdateSpiritualInput = {
  verseText?: string;
  verseReference?: string;
  title?: string;
};

export async function updateSpiritualContent(
  client: SupabaseServerClient,
  id: string,
  input: UpdateSpiritualInput,
): Promise<void> {
  const patch: Database['public']['Tables']['spiritual_content']['Update'] = {};
  if (input.verseText !== undefined) patch.verse_text = input.verseText;
  if (input.verseReference !== undefined) patch.verse_reference = input.verseReference;
  if (input.title !== undefined) patch.title = input.title;
  if (Object.keys(patch).length === 0) return;
  const { error } = await client.from('spiritual_content').update(patch).eq('id', id);
  if (error) throw error;
}
