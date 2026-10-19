# Slutgranskning – Slide Fable 0.5.0

Bedömning: **NOT_READY** för MVP/produktion. Utvecklingsleveransen är körbar och
har automatiserat verifierade delkedjor. Genomgången når DEV-015, men det innebär
inte att alla föregående klarkriterier är uppfyllda. Originalkraven har inte
skrivits om för att passa implementationen. Auktoritativ stegstatus finns i
`.system-builder/work-status.yaml`; denna rapport redovisar skälen och beläggen.

## Genomfört i återstående utvecklingssteg

| Steg | Implementerat | Verifiering och återstående gräns |
|---|---|---|
| DEV-004 | TypeScript-kärna, strikt JSON, inert HTML-import, schema, semantik, SHA/resurskontroll, 0.3-migration, skrivskydd | 58 kontraktsfixturer i paritet med Python; verkligt 0.2-exempel ur underlaget och uttryckligen härledd 0.1-fixtur. Full historisk kompatibilitet kan inte beläggas med dessa två delprofiler. |
| DEV-005 | Bilder/objekt, geometri, rotation, gemensam renderer, transaktioner, undo/redo, flytt- och storlekshandtag | Tre bilder, geometri och undo/redo provas genom UI. Kommandon provas separat. Fysisk touchredigering är inte verifierad. |
| DEV-006 | IndexedDB-arbetskopior, explicit återställning, atomisk versionsjämförelse, separat konfliktkopia, felstatus | Omstart/återställning, stale-tab-konflikt och injicerat kvotfel provas. Ingen verklig iOS-lagringseviction har testats. |
| DEV-007 | Ensam HTML med data, lokala resurser, inbäddade typsnitt/licens, visningsnavigation och återimport | Exakt modellroundtrip inklusive ID:n och källor; player utan nätanrop. Full självförsörjningsprofil avvisar externa resurser. |
| DEV-008 | Tiptap-runs/listor/länkar, kopiering, sök/ersätt, lager/lås, grupp, numerisk precision, rutnät, fördelning, formatkopiering | Objekt-/gruppkommandon och referenser provas. Full AT-203–205/217 är ännu inte verifierad; textautofit, typografisk precision och smarta objektguider är ofullständiga. |
| DEV-009 | Fem layouter, tema/master, overrides/reset/frikoppling och komponentbibliotek | Kärnprov för arv, overrides, reset och komponentdefinition. Avancerad design kräver JSON. Full återbindning av alla platshållarvarianter samt Safari-jämförelse saknas. |
| DEV-010 | Bildinfogning/ersättning, crop/fokus/mask, tabellceller/merge och bar/line/pie-data | Cellinmatning/sammanfogning och diagramdata provas samt HTML-roundtrip. Tabellers komplexa radspann/kolumnflytt och varje exportvariant kräver bredare prov. |
| DEV-011 | Process/hierarki/tidslinje, nodtext/riktning, säker LaTeX/MathML, SVG/banor och källbilagor | Nodändring/layout och källroundtrip provas. Skript/fjärr-SVG avvisas. Hierarkins parentId och full tidslinjesemantik saknar komplett layoutstöd. |
| DEV-012 | Presentatör, separerat publikfönster, anteckningar/timer, fragment, svart skärm, helskärm, touchsvep, sektioner/läsordning | Separat publikmodell utan anteckningar provas. Full läsordnings-, skärmläsar- och tvåskärmsacceptans, slutvy/nästa-bild-miniatyr och popup-fallback återstår. |
| DEV-013 | Lokal PDF med sökbar text, native enkla former/tabell, PNG/JPG, bildurval och rapport | Filer, sidantal, svensk textextraktion och PDF-rendering kontrolleras. Offline-PDF provas i byggd app i emulerade skärmstorlekar. Annan PDF-läsare, avbrott och fysisk tabletprestanda återstår. |
| DEV-014 | PPTX med separat text, former, tabell, chart och diagramformer; visual-first/platt profil; rasterfallback och källmetadata | OOXML har separata native-objekt. Verklig Office-redigering, typsnittsersättning, exakt textefterlikning och effektkomposition saknar full acceptans. |
| DEV-015 | Samlad automatisk körning, kravavstämning, drift-/användarguide och komplett källpaket | Automatiserade delprov kan vara gröna samtidigt som releasen är NOT_READY. Öppna grindar nedan förhindrar avslut av planen. |

## Acceptansmatris

PASS här betyder endast det avgränsade maskinprovet som anges. Samtliga
AT-kriterier kräver fortfarande full omfattning innan MVP får kallas godkänd.

| Källkrav | Belägg i leveransen | Samlad acceptans |
|---|---|---|
| AT-201–202 | Arv/override/reset-kommandon, layoutmodell, fem startlayouter | PARTIAL: tre-bilders logotypbyte, alla bindningsvarianter och full layoutcykel ej belagda |
| AT-203 | UI-redigering med blandad vikt, list-/länkmodell och HTML-roundtrip | PARTIAL: två listnivåer/länk hela vägen till faktisk Office ej belagda |
| AT-204–205 | Grupp/paste/undo och geometri, align/distribute/rutnät | PARTIAL: roterad avgruppering och objektguider saknas |
| AT-206 | Crop/fokus/mask/ersättning i modellen och UI | PARTIAL: full fotorealistisk referensserie och exportjämförelse saknas |
| AT-207–208 | Tabellmerge och diagramdata via UI, roundtrip, native OOXML | PARTIAL: alla spann, alla tre charttyper och datatolerans i Office ej belagda |
| AT-209 | Publikfönster utan speakerNotes i överförd modell, presenterarläge/timer | PARTIAL: verkliga två skärmar och full nästa-bild-vy saknas |
| AT-210–211 | Explicit återställning, versionskonflikt, kvotfel, ensam HTML utan nätanrop | PASS för dokumenterade delprov; verklig iOS-lagring/offlineöppning återstår |
| AT-212 | Tre PDF-sidor, svensk sökbar text, Poppler-rendering och inbäddad font | PARTIAL: annan läsare och full tecken-/layoutmatris saknas |
| AT-213 | Native text/tabell/chart/former och rasterposter i OOXML | PARTIAL: redigering i PowerPoint Mac/Windows saknas |
| AT-214 | Visual-first rasteriserar icke-text och behåller separat huvudtext | PARTIAL: numerisk visuell tolerans och Office-jämförelse ej etablerade |
| AT-215 | Rapport per objekt och explicita effekt-/font-/interaktionsvarningar | PARTIAL: rapport för varje ovanligt/importerat objekt och komplex grupp måste fördjupas |
| AT-216/308 | 0.3-migration, faktisk 0.2-prosafixtur, härledd 0.1-delprofil, inert text/import | BLOCKED: full historisk migrationsacceptans saknar representativa ursprungsfiler/schema |
| AT-217 | ID-säker kopiering/duplicering, sök/ersätt och sektioner | PARTIAL: övergripande scenarioprov saknas |
| AT-218 | Alla bilder PNG/JPG i vald bredd, aktuellt-bild-urval i UI | PARTIAL: PNG-filer provas; samtliga upplösningar och JPG/urval i full matris återstår |
| AT-301–303/307 | Diagram- och formelkälla bevaras, SVG säkerhetsprov, ensam HTML | PARTIAL: full hierarki/tidslinje och visuell formelkonsistens återstår |
| AT-304/306/309 | Begränsade deklarativa klickåtgärder, native diagramformer, ingen importerad JS-körning | PARTIAL: åtgärder/alla tillstånd och Office-prov återstår |
| AT-305 | Okända/avancerade objekt kan visa säker poster eller explicit varning | Utökad viewer/media/3D-funktion ingår inte i denna MVP-etapp |

## Öppna releasegrindar och åtgärder

1. **Historisk kompatibilitet:** skaffa representativa ursprungliga 0.1/0.2-filer
   och deras kontrakt. Nuvarande legacy.ts är en avgränsad, explicit migration;
   den härledda 0.1-fixturen är inte belägg för godtyckliga historiska filer.
   Originalet hålls kvar vid skrivskydd och fel får inte ändra aktuellt dokument.
2. **Full redigeringssemantik:** slutför och testa clip/shrink-to-fit/expand-height/
   warn för rik text, mer komplett listtypografi, roterad avgruppering, ankarsidor,
   objektguider och samtliga platshållarbindningar. I nuvarande renderer klipps text;
   olika importerade overflow-policyer uppfylls inte ännu. Gruppavgruppering med
   rotation avvisas i stället för att ge ändrad geometri.
3. **Avancerade objekt:** slutför parentId-baserad hierarki, tidslinjens placering,
   tabellspann och alla chartdatavarianter. Det går att redigera JSON, men det är
   inte samma sak som att varje giltig PPD-variant återges korrekt. Vissa avancerade
   valfria objekt får en explicit reservrepresentation.
4. **Exportfidelitet:** backdrop blur i editable-first har ännu inte fullständig
   bakomliggande komposition. Rapporten varnar; visual-first/platt kan användas
   efter granskning. PDF:s native text mäts i DOM och använder DejaVu; kursiv
   simuleras och godtyckliga fonts/glyfer är inte täckta. PPTX-text är uppdelad i
   uppmätta textfragment för att bevara placering; Office kan ändå ändra mått.
   Källmetadata är ett customXml-part som måste provöppnas i Office.
5. **Tillgänglighet/presentatör:** verifiera skärmläsare, listsemantik, kontrast,
   reducerad rörelse, verklig touch och två skärmar. Publikfönster kräver tillåten
   popup. BroadcastChannel använder en gemensam kanal per origin; kör en
   presentation åt gången tills sessionsisolering är införd.
6. **Långvarig PWA-drift:** inför selektiv säker cachegallring med verifiering av
   aktiva klientversioner. Äldre cacher behålls nu konservativt. Mät tabletprestanda
   och lagringskvot. Ingen brytpunkt garanterar att alla dokumentstorlekar är snabba.
7. **Obligatoriska manuella prov:** Safari/iPad/iPhone-installation, offlineomstart,
   tangentbord/touch och WebKit; PowerPoint Mac/Windows öppna/redigera/exportera;
   PDF i en annan riktig läsare. WebKit kan inte köras med miljöns saknade
   systembibliotek. Ingen fysisk enhet eller Microsoft Office finns tillgänglig.
8. **Referenssvit:** komplettera ljus, mörk, fotorealistisk och diagramtung
   presentation med godkända toleranser och oberoende visuell granskning.
   Medföljande tekniska exempel ersätter inte denna kompletta referenssvit.

Dessa är verkliga kvarvarande krav, inte generella friskrivningar. Nästa
rekommendation är reparation/komplettering av första oavslutade steget och sedan
förnyad samlad acceptans. En automatiskt grön körning får aldrig ensam ändra
releasebedömningen till READY.

## Belägg och reproduktion

`tests/core.test.mjs` provar TypeScript-paritet mot 58 kontraktsfixturer och
migrations-/importfall. `tests/editor.test.mjs` provar transaktioner och referenser.
`tests/editor-browser.mjs` provar riktiga UI-flöden, roundtrip, återställning,
exportstruktur, publiksekretess och responsivitet. `tests/pwa.mjs` provar byggda
versioner, scopes, offlineöppning, offline-PDF, uppdatering och flera flikar.

`.system-builder/final-verification.json` innehåller körresultat och källhashar.
Historiska dev001–003-belägg bevaras med sina dåvarande revisionshashar.
Inga browser-skärmbilder ingår i leveransen. PDF-kontroll använder Poppler/pypdf;
det är inte ett PowerPoint-prov eller ett prov på fysisk läsplatta.
