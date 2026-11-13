# UX-12 – Duplicera tabellrad

En användare kan duplicera valfri tabellrad genom **Duplicera rad**. Den nya raden placeras direkt under originalet.

- Innehåll, cellformat, horisontella sammanslagningar och övriga cellfält kopieras.
- Varje ny cell får ett unikt ID. Kopierade formateringsobjekt är djupkopior och ändringar påverkar inte originalet.
- Befintliga rader och deras identiteter bevaras.
- Ogiltiga tabeller, vertikala spann och identifieringskollisioner avvisas utan ändring.
- Befintlig objektuppdatering används för Ångra/Gör om. Ingen PPD-migration.

Verifiera `tests/table-row-duplicate.test.mjs` i GitHub Actions tillsammans med projektets övriga tester. Manuella Safari/iPad- och Office-prov kvarstår; release = NOT_READY.
