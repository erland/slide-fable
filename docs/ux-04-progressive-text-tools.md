# UX-04 – Mindre överlastad textredigering i egenskapspanelen

## Syfte
Hålla grundläggande textredigering (fet, kursiv, understruken) synlig utan att varje avancerad egenskap upptar plats i egenskapspanelen. Direktredigering på bilden ändras inte.

## Beteende
- I egenskapspanelens textredigerare visas fet, kursiv och understruken som tidigare.
- Listor, indrag, styckeavstånd, typsnitt, markering, textläge, länk och övriga inställningar ligger under `Fler textverktyg`.
- Disclosure öppnas med mus, touch eller tangentbord och används med samma befintliga kommandon.
- Objektomfattande textstorlek och textfärg (UX-03) ligger fortsatt utanför disclosure och är direkt åtkomliga.
- Inga ändringar i dokumentformat eller formateringens lagringslogik.

## Verifiering
Utökat `tests/editor-browser.mjs` kontrollerar att grundverktygen är synliga, avancerade verktyg är infällda, kan fällas ut och att existerande typografi- och styckekontroller fungerar efter öppning. Full GitHub Actions-verifiering krävs före merge.
