# Hook/UI — useToast

- Percorso: `components/ui/use-toast.tsx`

## Scopo
Hook per pubblicare toasts dall'UI.

## API
- API: `const { toast } = useToast()`.

## Dipendenze interne
- Contesto toasts.

## Casi bordo
- Chiamate ripetute; concorrenza.

## Anti-pattern
- Toast su eventi ad alta frequenza.

## Esempi d’uso
- Azioni di successo/errore.

## Punti di estensione
- Categorization e rate limit.

## Collegamenti
- Moduli: 04, 05