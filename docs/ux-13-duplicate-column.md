# UX-13 – Duplicera tabellkolumn

I tabellredigeraren kan användaren duplicera en valfri kolumn med knappen **Duplicera kolumn**. Kopian placeras omedelbart till höger om kolumnen.

- Alla rader får en kopia av respektive cells innehåll, formatering och attribut.
- Kopior får unika cell-ID:n. Originalceller och deras identiteter bevaras.
- Eventuell explicit kolumnbredd dupliceras på samma plats. Ingen bredd skapas om tabellen använder standardbredder.
- Horisontella sammanslagningar utanför målkolumnen bevaras; en sammanslagen målcell blockerar åtgärden.
- Vertikala spann, ogiltig tabellstruktur, felaktiga bredder och utmattad ID-generering avvisas utan datatapp.
- Använder befintlig onChange/Ångra/Gör om; PPD-formatet ändras inte.

## Kontroll
`tests/table-column-duplicate.test.mjs` testar kolumnplacering, djupkopiering, cell-ID:n, bredder och avvisade gränsfall. GitHub Actions kandidatverifiering och releasegrindar bedöms separat. Release förblir NOT_READY.
