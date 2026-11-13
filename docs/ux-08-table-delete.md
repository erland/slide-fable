# UX-08 – Säker borttagning av tabellrader och kolumner

## Problem
Tabellredigeraren hade knappar för att lägga till rader och kolumner, sammanfoga och dela celler men saknade motsvarande borttagning. För att radera en rad eller kolumn krävdes redigering av tabellens JSON, vilket kan ge ogiltig PPD-struktur.

## Funktion
- En **Ta bort rad**-knapp per rad och **Ta bort kolumn**-knapp per logisk kolumn finns i den befintliga tabellredigeraren, både i Start/Formatera och egenskapspanelen.
- En tabell måste behålla minst en rad och en kolumn.
- Borttagning ändrar inte kvarvarande cell-ID:n, innehåll eller formatering.
- En uttrycklig tabelllayout med `columnWidths` uppdateras i samma redigering som cellerna.
- Sammanslagna celler bevaras om den borttagna kolumnen ligger utanför sammanslagningen. Att ta bort en kolumn **genom** en horisontellt sammanslagen cell spärras; motsvarande gäller vertikala spann och icke-rektangulära tabeller. Ingen implicit celluppdelning eller tyst dataförlust.
- Åtgärden är en transaktion via ordinarie `onChange`, med Ångra/Gör om.
- För komplexa tabeller behövs senare en separat, validerad hantering av vertikala spann och borttagning inuti sammanslagningar.

## Testning
- `tests/table-delete.test.mjs`: enkel borttagning, gränser, bevarade ID:n, kolumnbredder, icke-berörda merges och avvisade ogiltiga grid.
- `tests/table-split-browser.mjs`: lägg till/ta bort, Ångra/Gör om, spärrad merge, överlevande objekt och redigerbar PPTX-tabell i desktop/iPad portrait/mobil.
- Full kandidat-CI krävs före merge. Fysiska Safari- och PowerPoint-acceptanser är separata releasegrindar.
