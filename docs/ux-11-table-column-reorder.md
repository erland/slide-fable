# UX-11 – Flytta tabellkolumner

## Funktion
En tabellkolumn kan flyttas ett steg åt vänster eller höger i tabellredigeraren. Den tidigare specialknappen **Flytta sista kolumnen först** ersätts av konsekventa kolumnkommandon.

- Flytten gäller samtliga rader; cell-ID, text och formatering följer respektive cell.
- Eventuella explicita kolumnbredder följer med kolumnen. Utan explicita bredder lagras inga nya.
- Celler som är sammanslagna i de två berörda kolumnerna blockerar flytten, men sammanslagningar utanför området bevaras.
- Vertikala spann, inkonsekvent tabellstruktur och ogiltiga bredder blockeras.
- Ordinarie objektuppdatering ger stöd för Ångra/Gör om. PPD-formatet ändras inte.

## Verifiering
Enhetstester: `tests/table-column-reorder.test.mjs`. GitHub Actions kandidatverifiering ska passera innan merge. Fysisk Safari/iPad, Microsoft Office och full releaseacceptans kvarstår; release = NOT_READY.
