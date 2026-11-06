# NutriPace AI

Dla wszystkich osób, które chcą osiągnąć swój cel sylwetkowy i zdrowotny, ale potrzebują elastycznego, inteligentnego planu dopasowanego do ich budżetu, sprzętu i nagłych zmian w sklepie.

## O projekcie

NutriPace AI to nowoczesna aplikacja webowa oparta na sztucznej inteligencji, która kompleksowo wspiera użytkownika w drodze do lepszej formy. Użytkownik określa swój cel (redukcja, masa, zdrowie), budżet na jedzenie, dostępny sprzęt (dom/siłownia) oraz nietolerancje pokarmowe. OpenAI generuje spersonalizowany plan treningowy oraz jadłospis na cały tydzień wraz z listą zakupów. System obsługuje także dynamiczne zapytania w trakcie tygodnia – np. natychmiast podpowiada zamienniki, gdy w sklepie zabraknie konkretnego składnika.

> ⚠️ NutriPace AI generuje plany o charakterze informacyjnym. Nie zastępuje porady lekarza ani dietetyka.

## Zespół

| Imię i nazwisko | GitHub |
|---|---|
| Olexandra Shchukis | @leeree1 |
| Zuzanna Sagan | @aatec13 |

## Zakres MVP

Zespół jest dwuosobowy, dlatego MVP obejmuje jedną ścieżkę użytkownika:

**formularz profilu → generowanie planu (jadłospis + trening) → widok tygodnia → lista zakupów**

„Ratunek w sklepie" (zamienniki składników) jest rozszerzeniem realizowanym po ukończeniu MVP.

## Technologia

* **Framework:** React + Vite
* **Język:** TypeScript
* **Stylizacja:** Tailwind CSS, Lucide React
* **AI:** OpenAI API (GPT-4o) – generowanie planów i zamienników
* **Backend (proxy):** funkcje serverless na Vercel (`/api/...`)
* **Format odpowiedzi AI:** Structured Outputs (JSON Schema) + walidacja Zod przed wyświetleniem

### Gdzie działa wywołanie OpenAI

Przeglądarka **nigdy** nie komunikuje się z OpenAI bezpośrednio. Woła tylko nasze endpointy `/api/...`, a dopiero funkcja serverless (z kluczem w zmiennej środowiskowej serwera) pyta OpenAI:

```
React (przeglądarka)
   │  POST /api/generate-plan   { SurveyData }
   ▼
Funkcja serverless (Vercel)  ──►  OpenAI API (GPT-4o, structured output)
   │  walidacja odpowiedzi (Zod)
   ▼
React  ◄──  NutriPlan (JSON)
```

### Bezpieczeństwo klucza OpenAI

- Klucz `OPENAI_API_KEY` jest wyłącznie zmienną środowiskową **serwera** (Vercel → Environment Variables). Nie trafia do kodu frontu ani do zmiennych `VITE_*`, bo te lądują w bundlu i są widoczne w przeglądarce.
- `.env` jest w `.gitignore`, a w repo jest tylko `.env.example` bez wartości.
- [ ] Ustawić limit wydatków na koncie OpenAI.

## Funkcje

Opis każdej funkcji: co robi użytkownik, widok, dane, najtrudniejsze, kryterium gotowości.

### F1. Formularz profilu (ankieta)

**Właściciel:** @leeree1 · **Status:** gotowe (do sprawdzenia na ekranie 360 px)

- **Co robi użytkownik:** przechodzi 4 kroki: cel (redukcja / masa / zdrowie), tygodniowy budżet na jedzenie, miejsce treningu ze sprzętem i liczbą dni, nietolerancje pokarmowe.
- **Widok:** wieloetapowy formularz (mobile first) z paskiem postępu; w ostatnim kroku przycisk „Generuj plan", który od razu uruchamia generowanie.
- **Dane:** wejście – odpowiedzi użytkownika; wyjście – obiekt `SurveyData` (`src/types/survey.ts`).
- **Najtrudniejsze:** walidacja kroków i spójność danych (np. sprzęt domowy tylko przy treningu w domu) oraz dostępność (obsługa klawiaturą i czytnikiem ekranu).
- **Po odświeżeniu strony:** zapisane są ukończona ankieta (`SurveyData`) i wygenerowany plan (`localStorage`). Rozpoczęty, niedokończony szkic ankiety na razie nie jest zapisywany (do zrobienia na M1).
- **Gotowe, gdy:** nie da się przejść dalej bez wymaganych odpowiedzi, a na końcu aplikacja otrzymuje poprawny `SurveyData`; formularz działa na ekranie 360 px i na desktopie.

### F2. Generowanie planu (proxy + OpenAI)

**Właściciel:** @aatec13 · **Status:** w trakcie (jest ładowanie, błąd, ponowienie i anulowanie; czeka na test z prawdziwym API)

- **Co robi użytkownik:** kończy ankietę (to od razu uruchamia generowanie), widzi stan ładowania z możliwością anulowania, a przy błędzie może spróbować ponownie.
- **Widok:** ekran ładowania i komunikat o błędzie z przyciskiem „Spróbuj ponownie".
- **Dane:** wejście – `SurveyData` wysyłane na `POST /api/generate-plan`; wyjście – `NutriPlan` (jadłospis na 7 dni, plan treningowy, lista zakupów, podsumowanie makroskładników; `src/types/plan.ts`).
- **Najtrudniejsze:** wymuszenie poprawnego JSON-a (Structured Outputs + Zod), pilnowanie nietolerancji i budżetu w odpowiedzi modelu, czas odpowiedzi i limity funkcji serverless, kontrola kosztów.
- **Gotowe, gdy:** dla kilku przykładowych ankiet endpoint zwraca plan zgodny ze schematem, niepoprawna odpowiedź modelu jest wychwytywana (ponowienie lub błąd), a klucza OpenAI nie ma w kodzie frontu.
- **Tryb mock:** przy `VITE_USE_MOCK=true` aplikacja zamiast wołać `/api` zwraca przykładowy plan po krótkim opóźnieniu, więc interfejs można rozwijać bez backendu i bez kosztów OpenAI. Kryterium: z włączonym mockiem da się przejść całą ścieżkę (ankieta → plan → lista zakupów) przy samym `npm run dev`.

### F3. Widok tygodnia (jadłospis + trening)

**Właściciel:** @leeree1 · **Status:** w trakcie (widoki jadłospisu i treningu istnieją i pokazują 7 dni pod sobą; zakładki i wybór dnia 1–7 do zrobienia)

- **Co robi użytkownik:** przegląda plan dzień po dniu i przełącza zakładki Jadłospis / Trening.
- **Widok:** dashboard z zakładkami, wybór dnia (1–7), karty posiłków z makroskładnikami, lista ćwiczeń (serie, powtórzenia).
- **Dane:** `NutriPlan.mealPlan` i `NutriPlan.trainingPlan`.
- **Najtrudniejsze:** czytelność dużej ilości danych na telefonie, obsługa dni odpoczynku, spójne jednostki i makroskładniki.
- **Gotowe, gdy:** wszystkie 7 dni da się przejrzeć na ekranie 360 px bez przewijania poziomego, a dane pochodzą wprost z `NutriPlan` bez ręcznych poprawek.

### F4. Lista zakupów

**Właściciel:** @aatec13 · **Status:** w trakcie (lista z kategoriami, odhaczaniem i sumą kosztów działa; porównanie z budżetem do zrobienia)

- **Co robi użytkownik:** widzi listę zakupów pogrupowaną według kategorii, odhacza kupione produkty i porównuje szacowany koszt z budżetem.
- **Widok:** zakładka „Zakupy": kategorie z polami wyboru i sumą kosztów.
- **Dane:** `NutriPlan.shoppingList` (kategorie → pozycje: nazwa, ilość, jednostka, cena szacunkowa) oraz budżet z `SurveyData`.
- **Najtrudniejsze:** zgodność listy z jadłospisem (sumowanie składników), wiarygodność cen szacowanych przez model, zapamiętywanie odhaczeń po odświeżeniu strony.
- **Odhaczenia a nowy plan:** odhaczenia są przypisane do konkretnego planu. Wygenerowanie nowego planu albo „Zacznij od nowa" czyści je, więc nowy plan zaczyna od pustej listy.
- **Gotowe, gdy:** każdy składnik z jadłospisu jest na liście, pozycje są pogrupowane, a odhaczenia przeżywają odświeżenie strony.

### F5. Ratunek w sklepie (rozszerzenie)

**Właściciel:** @leeree1 · **Status:** po ukończeniu MVP

- **Co robi użytkownik:** gdy w sklepie brakuje składnika, wskazuje go i dostaje 2–3 zamienniki.
- **Widok:** przycisk przy posiłku i na liście zakupów otwiera okno z propozycjami.
- **Dane:** wejście – składnik, posiłek i nietolerancje na `POST /api/substitute`; wyjście – `SubstituteResponse` (typ do dodania w `src/types/plan.ts`; na razie go tam nie ma).
- **Najtrudniejsze:** zamiennik nie może łamać nietolerancji ani mocno zmieniać makroskładników; odpowiedź musi przyjść w kilka sekund, bo użytkownik stoi w sklepie.
- **Gotowe, gdy:** dla typowych składników zamienniki wracają w kilka sekund i respektują nietolerancje z profilu.

## Struktura katalogów

```
api/
└── generate-plan.ts             # funkcja serverless (proxy do OpenAI)
src/
├── main.tsx
├── App.tsx                      # widoki: ankieta → generowanie → plan
├── index.css                    # Tailwind + paleta marki
├── components/                  # PlanGenerator, MealPlanView, TrainingPlanView, ShoppingListView, Disclaimer; ui/ – reużywalne komponenty
├── features/
│   ├── survey/                  # F1: ankieta
│   ├── dashboard/               # (planowane) F3: dashboard z zakładkami; dziś widoki są w components/
│   └── substitutes/             # (planowane) F5: „Ratunek w sklepie"
├── services/                    # planApi.ts (klient /api), mockPlan.ts (tryb mock), usePlanGeneration.ts
├── types/                       # SurveyData, NutriPlan… (kontrakt z JSON-em od AI)
└── lib/                         # cn, toggleItem, storage.ts (localStorage)
```

Import przez alias `@/` (np. `import { cn } from '@/lib/cn'`).

## Uruchomienie

```bash
npm install
npm run dev      # serwer deweloperski
npm run build    # sprawdzenie typów + build produkcyjny
npm run lint
```

### Tryby uruchomienia

**1. Z mockiem (bez backendu i bez klucza OpenAI):** utwórz plik `.env` w głównym folderze projektu (obok `package.json`) i dodaj linię:

```
VITE_USE_MOCK=true
```

Następnie uruchom `npm run dev` (po zmianie `.env` zrestartuj serwer). Po ankiecie aplikacja pokaże przykładowy plan po ok. 1 s. Samo `npm run dev` bez mocka nie obsługuje `/api`, więc generowanie zakończy się komunikatem o braku backendu.

**2. Z prawdziwym API (`vercel dev`):** skopiuj `.env.example` do `.env`, uzupełnij `OPENAI_API_KEY` i usuń (lub ustaw na `false`) `VITE_USE_MOCK`. Uruchom `vercel dev`, który obsługuje zarówno front, jak i funkcje z `api/`. Plik `.env` nie jest commitowany.
