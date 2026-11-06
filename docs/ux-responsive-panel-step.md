# SF-UX-RESP-01 – växlingsbara paneler i kompakt layout

Datum: 2026-11-05

## Ändrat
- På viewport upp till 900 CSS-px samt 901–1200 CSS-px i stående orientering visas arbetsytan alltid, med maximalt en nederpanel åt gången.
- `Bilder` visar en horisontell miniatyrremsa; `Egenskaper` visar en rullbar egenskapsdocka; `Arbetsyta` visar ingen extra nederpanel.
- Panelvalet öppnar den panel som tidigare kan ha dolts med visningskontroll.
- Den dubblerade knappen för att dölja egenskaper i canvas är dold i kompakt layout; panelväxling sker genom flikarna.
- Större skrivbordslayouter påverkas inte.

## Verifiering
- PASS: statisk kontroll av TSX-ändring, CSS-selektorer och klammerbalans.
- EJ KÖRT: `npm ci`, `npm run build`, `npm run lint`, `npm test` och webbläsartester. Denna miljö kunde inte slutföra installation av npm-beroenden.
- Krävs före merge: kör `npm ci && npm run lint && npm run build && npm test`, samt kontrollera desktop 1440×900, iPad liggande 1180×820, iPad stående 820×1180 och mobil 390×844. Kontrollera panelväxling, objektmarkering, tangentbord, textredigering och att val inte går förlorade.

## Avgränsning
- Ingen ändring av PPD-modell, import eller export.
- Detta steg är inte slutverifierat; status är implementation levererad, verifiering väntar.
