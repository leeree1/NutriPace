# NutriPace AI

Aplikacja webowa (React + Vite + TypeScript + Tailwind CSS 4 + Lucide), która na podstawie ankiety generuje
plan treningowy, jadłospis na 7 dni i listę zakupów (OpenAI GPT-4o) oraz podpowiada zamienniki składników w sklepie.

## Uruchomienie

```bash
npm install
npm run dev      # serwer deweloperski
npm run build    # tsc + build produkcyjny
npm run lint
```

## Struktura katalogów

```
src/
├── main.tsx
├── App.tsx                      # routing widoków: ankieta → dashboard
├── index.css                    # Tailwind + paleta marki (@theme)
├── components/ui/               # reużywalne, "głupie" komponenty UI
├── features/                    # moduły per funkcjonalność MVP
│   ├── survey/                  # Krok 1: ankieta (gotowe)
│   │   ├── SurveyForm.tsx
│   │   ├── useSurveyForm.ts     # logika kroków i stanu
│   │   ├── survey.options.ts    # etykiety, ikony, stałe
│   │   ├── survey.validation.ts
│   │   └── steps/
│   ├── dashboard/               # Krok 3: zakładki (jadłospis / trening / zakupy)
│   └── substitutes/             # Krok 4: "Ratunek w sklepie"
├── services/
│   └── openai/                  # Krok 2: komunikacja z OpenAI (json_object)
├── types/                       # SurveyData, NutriPlan… = kontrakt z JSON-em od AI
└── lib/                         # małe helpery (cn, toggleItem)
```

Import przez alias `@/` (np. `import { cn } from '@/lib/cn'`).
