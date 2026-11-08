# SF-NEXT-05a – verifiering av sparstatus

Datum: 2026-11-08.

## Ändring

- Synlig lokal sparstatus i dokumentrubriken i stället för endast i sidfoten.
- Tillgänglig `role=status` med `aria-live=polite` på en enda plats.
- Förklarande tooltip om skillnad mellan lokal arbetskopia och hämtad HTML-fil.
- Regression i `tests/document-file-browser.mjs` för desktop, tablet portrait och mobil samt fortsatt Spara/Spara som.

## Verifiering

Agent Workspace (Node.js 22, Playwright Chromium Headless Shell), körd på SF-NEXT-05a kandidat 2:

- `npm ci`: PASS (208 paket).
- `npm test`: PASS inklusive dokumentfilflöden i desktop 1440×900, ipad-portrait 820×1180 och mobil 390×844, PWA/offline, tidigare exportregressioner.
- `npm run build`: PASS (TypeScript samt Vite, 445 moduler, PWA precache).
- En tidigare kandidat misslyckades på PWA-testets åtkomst till sidfotens `role=status`. Korrigerades till separat PWA-status i sidfoten och lokal arbetskopiestatus i rubriken. Slutlig kandidat passerade.
- Varningar: Browsermiljön använde Chromium Headless Shell, inte full Chromium; stor bundle i Vite (>500 kB). Det är inte releaseacceptans i fysisk Safari/iPad.

## Kvarstående

Användarstudie av sparflöde, faktisk Safari/iPad och releasegrindar.
