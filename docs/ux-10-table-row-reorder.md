# UX-10 – Flytta tabellrader

## Omfattning
- Visa Uppåt/Nedåt intill respektive tabellrad i tabellredigeraren.
- Flytta hela raden ett steg utan att ändra dess cell-ID, cellinnehåll, sammanslagningar eller formatering.
- Åtgärden går genom befintlig objektuppdatering och kan ångras/göras om.
- Knappar inaktiveras i ytterlägen och vid tabeller med vertikala spann, inkonsekvent logisk kolumnbredd, dubblett-ID eller annan osäker struktur.
- Ingen PPD-formatändring.

## Verifiering
- `tests/table-row-reorder.test.mjs` kontrollerar flytt, returfärd, gränser, identiteter, spans och källdataintegritet.
- Kandidat-CI måste passera innan steget får mergas. Faktisk Safari/iPad och Office-acceptans ingår inte i denna deländring.
- Releasebedömning: NOT_READY.
