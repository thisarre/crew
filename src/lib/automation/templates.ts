/**
 * Modèles de services générés automatiquement.
 *
 * ⚙️ ÉDITE CE FICHIER pour changer les services récurrents (jour, horaires, lieu, compétences).
 *
 * Les compétences sont référencées PAR NOM (résolues en UUID au moment de la génération depuis
 * la base), car les IDs réels en production diffèrent des IDs de seed/démo.
 */

export type ServiceTemplate = {
  /** Type de service (doit exister dans la contrainte CHECK de la table `services`). */
  eventType: 'sunday_service' | 'midweek_service';
  /** Jour de la semaine, convention UTC getUTCDay() : 0 = dimanche … 6 = samedi. */
  weekday: number;
  /** Heure de début, format 'HH:mm' (normalisée par createService). */
  startTime: string;
  /** Heure d'arrivée, format 'HH:mm'. */
  arrivalTime: string;
  location: string;
  /** Noms des compétences à pourvoir (un créneau chacun). */
  slotSkillNames: string[];
};

export const SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    eventType: 'sunday_service',
    weekday: 0, // dimanche
    startTime: '14:00',
    arrivalTime: '13:30',
    location: 'Salle principale',
    slotSkillNames: ['Sono', 'Caméra', 'Diffusion'],
  },
  {
    eventType: 'midweek_service',
    weekday: 3, // mercredi
    startTime: '19:30',
    arrivalTime: '19:00',
    location: 'Salle principale',
    slotSkillNames: ['Sono'],
  },
];

/** Horizon glissant : on maintient toujours ~4 semaines de services à venir. */
export const HORIZON_WEEKS = 4;
