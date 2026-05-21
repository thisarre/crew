import { describe, expect, it } from 'vitest';

import { searchBible, versesCount } from '@/lib/bible/search';

describe('searchBible', () => {
  it('charge l\'extrait de démo', () => {
    expect(versesCount()).toBeGreaterThanOrEqual(3);
  });

  it('trouve un verset par contenu textuel (accent-insensible)', () => {
    const results = searchBible('unite');
    expect(results.some(r => r.reference === 'Éphésiens 4:3')).toBe(true);
  });

  it('trouve un verset par référence partielle', () => {
    const results = searchBible('Jean 3');
    expect(results.some(r => r.reference === 'Jean 3:16')).toBe(true);
  });

  it('priorise les correspondances de référence', () => {
    const results = searchBible('Psaume');
    expect(results[0]?.reference).toMatch(/^Psaume/);
  });

  it('renvoie vide pour une requête trop courte', () => {
    expect(searchBible('a')).toEqual([]);
    expect(searchBible('')).toEqual([]);
  });

  it('respecte la limite de résultats', () => {
    const results = searchBible('e', { limit: 2 }); // 'e' < 2 chars → vide ; on teste un terme réel
    expect(results.length).toBeLessThanOrEqual(2);
    const many = searchBible('que', { limit: 1 });
    expect(many.length).toBeLessThanOrEqual(1);
  });
});
