# Slide Fable – fortsättning efter nulägesavstämning

> **Aktuell läsanvisning efter DOC-FIX-03 (2026-11-08):** Detta dokument innehåller kronologisk historik och äldre rekommendationer. Aktuellt beslut, aktuell commit och nästa åtgärd står i [STATUS.md](../STATUS.md); tidigare SF-NEXT-09-noteringar om obekräftat CI-fel ersätts av verifierad GitHub-körning på PR #120 och tidigare main. All releaseacceptans är fortfarande `NOT_READY`.


Denna **kompletterande** plan avser kvalitet och användarupplevelse på den befintliga redigeraren. Den ersätter inte de ursprungliga DEV-001–015-kraven eller deras releasegrindar (`docs/development-plan.md`, `docs/release-review.md`). Kör ett steg per utvecklingsomgång. För att undvika att bryta det validerade äldre arbetsstatusschemat ligger SF-NEXT-steget här i stället för att omnumrera den historiska DEV-listan.

## SF-NEXT-01 – avstämning av faktisk status

**Status:** Dokumenterad 2026-11-08; ingen full ny lokal CI-körning gjord.

- Leverans: `STATUS.md`, `docs/current-state-2026-11-08.md`, detta dokument och separat avstämningsmetadata i `.system-builder/work-status.yaml`.
- Verifiering: YAML/schema och planeringskontroller; kontroll att körbar kod inte modifierats; historisk releasebedömning bibehållen.
- Klart när: statuskonflikten och skillnaden mellan automatiserad CI och formell acceptans tydligt redovisats.

## SF-NEXT-02 – arbetsflödesbaserad UX-granskning (genomförd statisk granskning 2026-11-08)

- **Utfall:** Se `docs/ux-review-sf-next-02.md`. Statisk granskning avslutad; browser- och iPad-acceptans återstår. Prioriterat konkret fynd UX-02-01.
- **Mål:** Identifiera konkreta, reproducerbara UX-brister i nuvarande redigerare, särskilt PowerPoint-liknande arbetsflöden och responsiv panelhantering.
- **Omfattning:** skapa presentation, lägg till/rangordna bilder, infoga och formatera text/form/bild/tabell/diagram, markering och egenskapspanel, undo, spara/öppna, presentera, exportera. Kontrollera desktop och smal vy; Safari på fysisk iPad dokumenteras som manuellt kvarstående vid otillgänglig hårdvara.
- **Leverans:** prioriterad fyndlista med reproduktionssteg, berörd komponent, förväntat/observerat beteende och separata testbara åtgärdsförslag. Inga funktionsändringar under granskningen.
- **Verifiering:** `npm run lint`, `npm run build`, relevanta befintliga UI-tester, browser-evidens där miljön medger och klar märkning av ej utförda kontroller.
- **Klart när:** varje identifierat problem har prioritet och verifierbart acceptanskriterium, eller granskad arbetsgång är dokumenterat utan fynd.

## SF-NEXT-03 – konsekvent ribbon, paneler och markering (kodändring genomförd, verifiering återstår)

- **Status 2026-11-08:** UX-02-01 kodändrad och regressionstest tillagt, men bygg- och browser-verifiering kunde inte slutföras i lokal miljö (ofullständiga npm-beroenden). Steget är därför **INTE färdigverifierat**.
- **Mål:** Åtgärda högst prioriterade faktiska UX-fynd från SF-NEXT-02, utan parallella redigeringsvägar.
- **Leverans:** en avgränsad implementation, uppdaterade regressionstester, dokumenterad beteendeförändring.
- **Verifiering:** lint, bygg, relevanta enhetstester och Chromium UI-flöden; iPad/WebKit när tillgängligt.

## SF-NEXT-04 – canvas/PPD/export-paritet

- **Mål:** Prioritera tydligt identifierade skillnader mellan redigerad presentation och PDF/PPTX.
- **Leverans:** reproducerbar referensfixtur, vald avgränsad fix och rapporterade återstående begränsningar.
- **Verifiering:** roundtrip, PDF/PPTX-struktur och faktisk Office-kontroll när miljö finns; inte bara grönt OOXML-prov.

## SF-NEXT-05 – vanliga saknade funktioner

- **Mål:** Bedöm frekvent använda PowerPoint-/Keynote-funktioner först efter verifierad UX-baslinje.
- **Leverans:** prioriterad gapmatris och högst en liten funktion med tester per steg.
- **Verifiering:** modell, redigering, lagring, tillgänglighet och export i tillämpliga delar.

## SF-NEXT-06 – acceptans och releaseberedskap

- **Mål:** Stäm av full ursprunglig acceptans (DEV-004–015, RG-001–010) mot verkliga belägg.
- **Leverans:** uppdaterad releasegranskning med PASS/FAIL/BLOCKED per grind och spårad evidens.
- **Verifiering:** full CI och manuella Apple/Office/PDF-/tillgänglighetsprov där obligatoriska. `NOT_READY` får inte ändras utan attest.

## SF-NEXT-04a – riktade semantiska kopplingar i PPTX (kod och automatiserade tester PASS, 2026-11-08)

- **Avgränsning:** Negativ bredd/höjd på semantiska diagramkopplingar med riktning vänster/upp i `pptxWriter.ts`.
- **Åtgärd:** Normalisera till icke-negativa PPTX-linjeboxar och använd `flipH`/`flipV` för att bevara riktningen.
- **Regression:** `tests/diagram-export.test.mjs` provar åtta riktningsfall samt ogiltig geometri.
- **Kvar inom SF-NEXT-04:** Referensjämförelser för PDF/PPTX och verklig Office-acceptans; avsluta inte hela steget baserat på denna delåtgärd.

- **Verifieringsrapport:** `docs/sf-next-04a-verification.md`. Fortsätt med SF-NEXT-04b (exportparitet med OOXML-/renderingsfixtur) innan helsteget avslutas.

## SF-NEXT-04b – exportgeometri som regressionstest (automatiserad PASS 2026-11-08)

- **Leverans:** `tests/export-geometry-parity-browser.mjs`, körs via `npm test` (`test:export-geometry`).
- **Referens:** PPD med två rektangulära former på olika positioner och med olika fyllningsfärger, skapad i Chromium.
- **Kontroller:** Editor-DOM:s normaliserade positioner/storlekar jämfört med PPD; PPTX/OOXML:s redigerbara shape-geometri jämfört med PPD; PDF rasteriserad med `pdftoppm` och kontrollerad på utvalda inre/yttre pixlar.
- **Begränsning:** Ingen full bilddiff, verklig Office-rendering, rotation, tabell/diagram, eller Safari/iPad-hårdvara. Dessa återstår inom SF-NEXT-04 och releaseacceptansen.
- **Verifiering:** Se `docs/sf-next-04b-verification.md`.

## SF-NEXT-04c – roterade former och inbäddade bilder i export (2026-11-08)

- **Avgränsning:** Utöka befintlig geometrifixtur med en roterad form och en inbäddad PNG-bild. Textparitet omfattas redan av `tests/text-export-parity-browser.mjs`; tabeller och diagram ska granskas separat.
- **Kontroller:** Editor-PPD-koordinater, rotation i PPTX `a:xfrm`, inbäddad bild i native PPTX `p:pic` och medierelation, färgsampling av PNG i PDF.
- **Verifieringsrapport:** `docs/sf-next-04c-verification.md`. Formell releaseacceptans och faktisk Office-rendering återstår.


## SF-NEXT-04d – redigerbar tabell och diagram i PPTX samt PDF-synlighet (PASS 2026-11-08)

- **Leverans:** `tests/export-data-parity-browser.mjs` via `npm test`, samt verifieringsrapport `docs/sf-next-04d-verification.md`.
- **Kontroller:** PPD/editor-geometri; redigerbar PowerPoint-tabell (3 rader och sex cellvärden); inbyggt diagram med kategori- och serienamn samt numeriska värden i OOXML; raster-PDF med objekt på förväntade platser.
- **Verifiering:** Agent Workspace Node 22 med Playwright Chromium Headless Shell: test, TypeScript och Vite build PASS.
- **Återstår:** avancerade tabellstilar, flera diagramtyper, rendering i verklig Office samt Safari/iPad-acceptans.
- **Nästa steg:** SF-NEXT-04e – utökad exportparitet för tabellformat och flera diagramtyper, eller separat reell Office-acceptans när tillgänglig.

## SF-NEXT-04e – sammanslagen/formaterad tabell samt linje- och cirkeldiagram (PASS 2026-11-08)

- **Leverans:** `tests/export-advanced-data-browser.mjs` körs via `npm test` (`test:export-advanced`). Native PPTX-struktur, tabellens `gridSpan`, cellfyllning, diagramdata och PDF-synlighet kontrolleras.
- **Verifiering:** Agent Workspace Node 22 med Playwright Chromium Headless Shell: `npm ci`, `npm test` och `npm run build` PASS.
- **Kvarstående:** Office/Safari/hårdvaruacceptans och historiska releasegrindar. Gå nu tillbaka till SF-NEXT-05/06 med UX-/funktionsprioritering; utför inte fler exportutökningar utan identifierat fel eller acceptanskrav.
- **Verifieringsrapport:** `docs/sf-next-04e-verification.md`.

## SF-NEXT-05a – synlig status för lokal arbetskopia (implementation 2026-11-08)

- **UX-fynd:** UX-02-02. Den lokala sparstatusen låg endast i sidfoten; användaren kunde blanda ihop autosparad arbetskopia och hämtad HTML-fil.
- **Ändring:** Dokumentrubriken visar nu status för lokal arbetskopia, med tydlig förklaring om att Arkiv → Spara hämtar en separat HTML-fil. Den dubbla statusuppläsningen i sidfoten tas bort. Det befintliga filbeteendet ändras inte.
- **Regression:** `tests/document-file-browser.mjs` kontrollerar synlig status i desktop, surfplatta och mobil, hjälpförklaring, overflow och att Spara/Spara som fortfarande genererar HTML-filer utan att ändra öppet dokument.
- **Status:** Automatiserade tester och produktionsbygge PASS i Agent Workspace 2026-11-08. Se `docs/sf-next-05a-verification.md`. Övriga SF-NEXT-05-funktioner och releasegrindar kvarstår.

## SF-NEXT-05b – redigera diagramseriernas namn utan JSON (PASS 2026-11-08)

- **Problem:** `ChartEditor` kan ändra kategorier/värden och lägga till serier men inte byta namn på befintliga serier.
- **Ändring:** Textfält för varje serienamn i samma diagramredigerare (ribbon och objektpanelen). Befintlig validerad `onChange`/undo-kedja återanvänds och PPD-formatet ändras inte.
- **Regression:** `tests/data-ribbon-browser.mjs` kontrollerar namnändring och undo i desktop, stående surfplatta och mobil.
- **Verifiering:** Agent Workspace, Node 22, `npm ci`, fullständig `npm test` (inklusive data-ribbon desktop/iPad portrait/mobile), TypeScript och Vite-byggnad PASS. Se `docs/sf-next-05b-verification.md`.
- **Återstår:** fysisk iPad/Safari och formell releaseacceptans.

## SF-NEXT-05c – ta bort diagramserier och kategorier i gränssnittet (PASS 2026-11-08)

- **Ändring:** `ChartEditor` erbjuder `Ta bort serie` och `Ta bort kategori` i såväl ribbon som egenskapspanel. Sista serien/kategorin kan inte tas bort. Kategoriborttagning tar bort samma värdeindex från samtliga serier; kvarvarande serieidentiteter bibehålls. All redigering använder ordinarie `onChange` och Ångra.
- **Regression:** `tests/data-ribbon-browser.mjs` kontrollerar tillägg/borttagning, att värdevektorerna förblir riktiga och att Ångra återställer originaldata i Chromium desktop/iPad portrait/mobile.
- **Verifiering:** Agent Workspace Node 22 med Chromium Headless Shell. Riktat `npm run test:data-ribbon` och resterande `test:raw` kördes i separata `npm test`-körningar på samma källkod på grund av körmiljöns tidsgräns; båda PASS och båda med TypeScript/Vite-produktionsbygge PASS. Se `docs/sf-next-05c-verification.md`.
- **Kvarstår:** Fysisk iPad/Safari och full releaseacceptans. Releasebedömningen är fortsatt `NOT_READY`.

## SF-NEXT-05d – ändra ordning på diagramserier och kategorier (2026-11-08)

- **Ändring:** `ChartEditor` har Uppåt/Nedåt för både serie och kategori i ribbon/egenskapspanel. Kategoriflytt byter atomärt plats på kategori och motsvarande värden i alla dataserier. Serieflytt bevarar serie-ID och hela värdevektorn. Första/sista radens otillämpliga riktning är inaktiverad. Ingen PPD-migration.
- **Regression:** `tests/data-ribbon-browser.mjs` kontrollerar gränsknappar, kategoriernas värdejustering för varje serie, serie-ID/ordning, återflytt och Ångra i desktop/iPad-portrait/mobil.
- **Verifiering:** Agent Workspace Node.js 22 och Chromium Headless Shell: riktat diagramtest och övriga regressioner PASS i separata körningar med godkänt produktionsbygge i båda. En sammanhängande fullkörning nådde tidsgränsen. Se `docs/sf-next-05d-verification.md`. Releasebedömningen är fortsatt `NOT_READY`.


## SF-NEXT-06 – samlad UX-/funktions- och releasegranskning (PLAN avslutad 2026-11-08)

- **Leverans:** `docs/sf-next-06-ux-release-review.md` med källbelagd arbetsflödesmatris, P1/P2-åtgärdskandidater och releasegrindar. Ingen applikationskod har ändrats och ingen ny browser-/Office-/Safari-verifiering påstås.
- **Beslut:** Release `NOT_READY` kvarstår. Automatisk deltesttäckning är inte formell acceptans. Gamla DEV-004–015 och RG-001–010 ändras inte.
- **Nästa avgränsade steg:** SF-NEXT-07a – UI-kommando för att dela horisontellt sammanslagen tabellcell, med tester för modell, Ångra, persistens, PPTX och responsiva vyer. Följ därefter panelarbetsflöden och verkliga releaseprov.

## SF-NEXT-07a – Dela sammanslagen tabellcell (implementation 2026-11-08)

Kommando, säker modellfunktion, enhetstest och browserregression levererade. Tre enhetstester PASS. **Pending verification:** npm build PASS i Agent Workspace; full npm test avbröts på tidsgräns och separat lint återstår; ej markera completed. Se `docs/sf-next-07a-verification.md`. Efter full PASS: SF-NEXT-07b, sammanhängande panel- och markeringstest. Release fortsatt NOT_READY.

## SF-NEXT-07a – slutverifierat 2026-11-08

Horisontellt sammanslagna celler kan nu delas via UI med bevarad innehålls- och cellidentitet, säker tabellbredd och validerad PPTX-tabellstruktur. **COMPLETED:** ESLint PASS, 180 enhetstester PASS, alla grupper av browserregressioner PASS och TypeScript/Vite-build PASS i Agent Workspace. Se `docs/sf-next-07a-verification.md` för testgrupper, miljö, omfattning och återstående releasegrindar.

**SF-NEXT-07b (rekommenderat nästa steg):** Testa och förbättra sammanhängande markera objekt → öppna/förankra egenskapspanel → redigera → byt bild → återgå i desktop, iPad portrait och mobil. Utgå från verifierade UX-problem, undvik ny generell panelarkitektur utan behov.


## SF-NEXT-07b – sammanhängande panel- och markeringstest (COMPLETED 2026-11-08)

Reproducerat och korrigerat felvänt egenskapspaneltillstånd vid öppna/stäng i `EditorApp.tsx`. Ny sammanhängande browserregression `tests/panel-workflow-browser.mjs` omfattar desktop/iPad portrait/mobil, objektmarkering, formatering, panelbyte, stäng/återöppna samt bildinfogning/ersättning. **ESLint, 180/180 enhetstester, samtliga browserregressioner i tre grupper och produktionsbygge PASS** i Agent Workspace. Se `docs/sf-next-07b-verification.md`.

**SF-NEXT-08 – rekommenderat nästa steg:** samla releasebevis för riktig Safari/iPad/iPhone, Office Mac och Windows, självständig PDF-läsare och tillgänglighet; avstämning mot RG-001–010 och AT-krav. Håll historisk 0.1/0.2-migration blockerad utan ursprungliga filer. Ändra inte `NOT_READY` utan acceptans.

## SF-NEXT-08 – verifierbar release-evidens (2026-11-08)

**Avgränsad leverans genomförd.** `RG-001`–`RG-004` har kompletta kontrollkrav och kan inte längre felaktigt få PASS med en ensam delkontroll. Nya Python-tester, GitHub Actions-evidensfil och dokumenterad manuell acceptansplan. Se `docs/sf-next-08-release-evidence.md`. Fysisk Safari, Office, oberoende PDF och historisk PPD kvarstår; release **NOT_READY**.

**Nästa rekommenderade steg:** kör full kandidat- och CI-verifiering med Python-beroenden och samla bevisfil. Därefter genomför manuella RG-005–010 och prioritera bekräftade fel.


## SF-NEXT-09 – sammanställd releaseverifiering (2026-11-08)

CI-evidens uppdaterad för felande delprov. Python-releasegrindtest 10/10 PASS och planeringshygien PASS. **Samlad CI-kandidatverifiering återstår**, eftersom lokalt `rfc8785` saknas och Agent Workspace saknar Python. `SF-NEXT-09` förblir partiellt utfört tills CI-verifiering för denna revision har PASS; release är `NOT_READY`. Se `docs/sf-next-09-candidate-verification.md`.

**Observerad spärr SF-NEXT-09:** `panel-workflow-browser.mjs` uppvisar intermittent bildersättningsfel i iPad portrait/mobil efter längre eller riktad browserkörning. Ingen komplett kandidat-PASS har uppnåtts; nästa steg är REPAIR med diagnostik och reproducerbart test, därefter full CI.

## DOC-FIX-01–03 – dokumentationsharmonisering (2026-11-08)

- **DOC-FIX-01:** PPD 0.4 och faktisk Pages-workflow dokumenterade i PR #119 (mergad).
- **DOC-FIX-02:** användarguide och källbelagd funktionsprofil uppdaterade i PR #120 (mergad).
- **DOC-FIX-03:** status, senaste kodrevision, CI-evidens och nästa prioritet harmoniseras med `STATUS.md` och `.system-builder/work-status.yaml` i separat dokumentations-PR. Den äldre DEV-004–015-planen är fortsatt normerande för kvarstående full acceptans.

**Aktuellt efter DOC-FIX-03:** kontrollera/slutför CI och Pages för `main` efter PR #120 samt utred Pages-fel; planera därefter återstående manuella releasegrindar. De gamla uppmaningarna ovan att starta SF-NEXT-07a/08 eller reparera SF-NEXT-09 är **historiska**, inte aktiva arbetsorder. Produktionsrelease förblir **NOT_READY**.
