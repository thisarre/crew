import rawVerses from '../../../public/bible-segond21.json';

export type BibleVerse = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
};

/**
 * Bible Segond 21 — importée statiquement depuis public/bible-segond21.json pour être
 * incluse dans le bundle (compatible serverless Vercel, contrairement à fs.readFileSync).
 * Le dépôt embarque un extrait de démo ; en prod, remplacer le fichier par les ~31k versets
 * (ou basculer sur la table Supabase `bible_verses` + recherche full-text si le bundle devient trop gros).
 */
const loadVerses = (): BibleVerse[] => (Array.isArray(rawVerses) ? (rawVerses as BibleVerse[]) : []);

/** Normalise pour une recherche insensible à la casse et aux accents. */
const normalize = (s: string): string => {
  const decomposed = s.toLowerCase().normalize('NFD');
  let out = '';
  for (const ch of decomposed) {
    const code = ch.codePointAt(0) ?? 0;
    // Ignore les diacritiques combinants (U+0300–U+036F)
    if (code >= 0x0300 && code <= 0x036f) continue;
    out += ch;
  }
  return out;
};

export type SearchOptions = { limit?: number };

/**
 * Recherche par référence (ex: "Jean 3", "Psaume 133:1") OU par contenu textuel.
 * Renvoie au plus `limit` résultats. Vide si la requête fait moins de 2 caractères.
 */
export const searchBible = (query: string, options: SearchOptions = {}): BibleVerse[] => {
  const limit = options.limit ?? 8;
  const q = normalize((query ?? '').trim());
  if (q.length < 2) return [];

  const verses = loadVerses();
  const byReference: BibleVerse[] = [];
  const byText: BibleVerse[] = [];

  for (const v of verses) {
    if (normalize(v.reference).includes(q)) {
      byReference.push(v);
    } else if (normalize(v.text).includes(q)) {
      byText.push(v);
    }
  }

  // Les correspondances de référence d'abord (plus pertinentes), puis le texte.
  return [...byReference, ...byText].slice(0, limit);
};

/** Nombre total de versets chargés (utile pour diagnostiquer l'extrait vs la Bible complète). */
export const versesCount = (): number => loadVerses().length;
