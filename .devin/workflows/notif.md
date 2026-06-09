---
description: Génère un message de notification respectant le ton Crew
---

Tu vas écrire un message de notification push pour Crew.

## Règles ton (NON-NÉGOCIABLE)
- Tutoiement, prénom préféré
- Chaleur > efficacité
- Phrase courte (< 100 caractères pour le body)
- 1 émoji max
- Verbe d'action
- Jamais "veuillez", "merci de", "rappel"
- Toujours s'adresser à la personne directement

## Format attendu
\`\`\`json
{
  "title": "...",
  "body": "...",
  "url": "/..."
}
\`\`\`

## Contexte de la notif
[Décris : quel moment dans la semaine, quelle action, quel destinataire, quel ton précis (rappel doux / merci / annonce / etc.)]

## Modèle conseillé
GPT-5.1-Codex (0 cr) suffit largement — c'est de la génération de texte court.