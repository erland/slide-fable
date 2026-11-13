# UX-16 – Säker tilläggning av tabellrad

## Bakgrund
Efter UX-15 hanteras tilläggning av tabellkolumner av en validerad modelloperation. Den äldre funktionen **Lägg till rad** skapade däremot celler direkt via redigerarens generella kopieringsfunktion, utan samma kontroll av tabellens struktur och cellidentiteter.

## Ändring
- **Lägg till rad** går via `appendTableRow` med validering av logisk tabellbredd, unika cell-ID:n och frånvaro av osäkra vertikala spann.
- En ny tom cell skapas för varje *logisk* kolumn; sammanslagna celler i tidigare rader bevaras.
- Genererade ID:n kontrolleras mot befintliga och mot andra nya ID:n.
- Felaktiga tabeller, ID-kollisioner och ogiltigt skapade celler avvisas utan partiell uppdatering.
- Ångra/Gör om använder redigerarens befintliga `onChange`; PPD-formatet påverkas inte.

## Verifiering
- `tests/table-row-append.test.mjs`: unit-regression för sammanslagningar, innehåll, identiteter, specialfall och oförändrad originalmodell.
- `tests/table-split-browser.mjs`: tilläggning av rad via UI samt Ångra/Gör om på desktop, stående iPad-storlek och mobil.
- Full kandidat-CI ska vara godkänd före merge. Safari på fysisk enhet och Office-acceptans återstår; release är fortsatt `NOT_READY`.
