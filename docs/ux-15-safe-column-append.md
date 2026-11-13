# UX-15 – Säker tilläggning av tabellkolumn

## Fynd
Efter UX-11–14 finns möjligheten att redigera, kopiera, flytta och ta bort kolumner med särskild hantering av `tableLayout.columnWidths`. Den äldre åtgärden **Lägg till kolumn** skapade däremot endast nya celler och lämnade explicita kolumnbredder orörda. Därmed kunde antalet bredder skilja sig från tabellens logiska kolumnantal.

## Ändring
- Lägg till kolumn använder en validerad, atomär modelloperation som skapar en unik tom cell sist på varje rad.
- Om en explicit lista över kolumnbredder finns kopieras den sista kolumnens bredd till den nya kolumnen. Utan sådan lista används fortsatt standardbredder.
- Horisontellt sammanslagna celler i äldre kolumner bevaras. Tabeller med ogiltig struktur, vertikala spann eller felaktig breddlista blockeras.
- Ångra/Gör om fungerar genom befintligt onChange-flöde, utan PPD-formatändring.

## Verifiering
Enhetstester i `tests/table-column-append.test.mjs` omfattar logisk bredd, explicita bredder, sammanslagningar, ID-kollisioner och avvisade indata. Full kandidat-CI krävs före merge. Fysiska Safari/iPad- och Office-grindar kvarstår; release NOT_READY.
