# Verifiering och releasegrindar

Planeringspaketets verifiering gäller bara filintegritet, referensschema, exemplet,
kravtäckning och återupptagbar plan. Appen har inga verifierade funktioner ännu.

## Automatiserat under implementation
Domäntest för commands/undo, ID:n, referenser, grupper, migration och säkerhet.
Integration för save/reopen, hash och exportreport. Playwright Chromium/Firefox/WebKit
för flöden, pointer/keyboard, felfall, offline och omstart av service worker.
WebKit i automation ersätter inte faktisk Safari/iPad-PWA. Vite-produktionsbuild,
TypeScript/lint och låsfilskontroller ska finnas från projektstommen.
GitHub Actions följer med ett kommande källprojekt även om leveransen görs via ZIP;
det krävs inte att användaren skapar ett repository för lokala kontroller.

## Manuella plattformsprov innan release
- Faktisk iPhone Safari och installerat läge: import/export via Filer, återstart offline,
  tangentbord, rotation, lågt lagringsutrymme och delningsflöde.
- Faktisk iPad Safari och installerat läge: touch, split view, extern tangentbord,
  presentera och exportera; tvåskärmsläge provas separat där det finns.
- macOS Safari/Chrome, Windows Edge och Firefox: editor och offlinefiler.
- PowerPoint Mac och Windows: öppna utan reparation, ändra text/form/tabell och spara.
- Riktig PDF-läsare: sidantal, sidformat, svensk text, markering/sökning, inga tomsidor.

## Testkorpus
Ljus, mörk, fotobakgrund/glaspanel, diagramtung, långa svenska texter och Unicode,
master/overrides, tabellmerge, formler, SVG, stora bilder och korrupta resurser.
Negativa: script-sluttagg, javascript-länk, SVG foreignObject/fjärrresurs, kvotfel,
okänd framtida feature, trasiga referenser, cykler och konflikt i två flikar.
Baslinjer ska knytas till motorversion och aktuell källrevision.

## Release
Alla normativa M/MVP och deras praktiskt möjliga automatiska tester ska PASS.
AT-01–12, AT-201–218 och relevanta AT-301–310/F-301–308 ska mappas till prioritet:
senare objekts fulla editortest väntar till dess etapp, men säker fallback och ingen
tyst dataförlust gäller från första läsare. Manuella prov ska ha faktisk evidens;
ej körda prov är pending, aldrig PASS. Miljöbegränsningar dokumenteras separat.
