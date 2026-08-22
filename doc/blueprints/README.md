# Blueprints

Specifiche di implementazione per feature non ancora (o non solo) coperte dalle reference in `doc/studio/`.

Un blueprint descrive contratto, vincoli, architettura, diagrammi e piano di lavoro. Non sostituisce il codice: è il documento da seguire prima di scrivere la feature.

## Convenzioni

- Una cartella `doc/blueprints/` per tutti i blueprint.
- Un file Markdown per feature, nome in kebab-case inglese, titolo in italiano.
- Stato in testa al documento: `proposto` | `in corso` | `implementato`.
- Diagrammi Mermaid quando il flusso, lo stato o i confini tra moduli non si capiscono dal testo.
- Quando la feature è in produzione, aggiornare anche la reference del componente/hook e questo indice.

## Indice

| Blueprint | Stato | Area |
|---|---|---|
| [Audio hero al cambio visibilità](hero-trailer-audio-visibility.md) | proposto | `HeroSection`, trailer YouTube |

## Collegamenti

- Reference hero: [`doc/studio/reference/components/hero-section.md`](../studio/reference/components/hero-section.md)
- Indice documentazione: [`doc/INDEX.md`](../INDEX.md)
