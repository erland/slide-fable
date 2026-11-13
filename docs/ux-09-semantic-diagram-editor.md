# UX-09 – Redigera semantiska diagram utan JSON

## Mål
Ge användaren möjlighet att ändra ordning, ta bort och lägga till noder samt skapa, omkoppla och ta bort riktade kopplingar i egenskapspanelen.

## Beteende
- **Noder**: redigera etikett, flytta upp/ned i ordningen, lägga till nod samt ta bort nod. Minst en nod måste återstå.
- **Kopplingar**: listan visar Från/Till för varje koppling och tillåter ändring av ändpunkter och borttagning. Nya kopplingar skapas med namngivna käll-/målnoder.
- En nod som tas bort får inte lämna kvar några kopplingar med ogiltiga ändpunkter. Direkt underställda noder får sitt `parentId` rensat.
- Flyttning ändrar endast nodernas ordning och bevarar deras ID:n, kopplingar och övriga egenskaper.
- Självkoppling och parallella dubblettkopplingar med samma riktning blockeras, likaså icke-existerande ändpunkter.
- Alla ändringar sker via ordinarie `onChange({semanticDiagram})` och är därmed individuellt ångerbara. PPD-formatet ändras inte.
- Befintlig JSON-editor finns kvar för avancerade strukturer och importerade egenskaper.
- Nya reglage är tillgängliga för desktop/iPad-porträtt/mobil genom samma egenskapspanel.

## Verifiering
- `tests/diagram-operations.test.mjs`: identiteter, relationer, städning, giltiga ändpunkter, ingen mutation.
- `tests/diagram-editor-browser.mjs`: nodordning, borttagning, kopplingar, ny nod och Ångra/Gör om för tre skärmstorlekar.
- Full GitHub Actions-kandidat måste passera före merge. Separat fysisk Safari/iPad-acceptans är fortfarande en releasegrind.
