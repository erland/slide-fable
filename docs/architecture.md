# Slide Fable – implementerad arkitektur

> **Källavstämning 2026-11-12:** Detta avsnitt beskriver implementationen i `main` `fc74c52d9b4d6c79b177ab912cefac5e803efec7`, inte en ännu oprövad målarkitektur. Funktioner är inte automatiskt releasegodkända för att de har kod och tester; se [projektstatus](../STATUS.md) och [releasegranskning](release-review.md).

## Systemöversikt

Slide Fable är en statiskt hostad React/TypeScript-app byggd med Vite. Den har ingen obligatorisk server för dokumentlagring eller användarkonton. Redigeringsmodellen är PPD, med `schemaVersion: "0.4.0"` för nya dokument. Applikationsskal och offlineuppdateringar är separata från själva användardokumenten.

| Del | Faktisk kod | Ansvar och avgränsning |
| --- | --- | --- |
| Modell och format | `src/core/model.ts`, `src/core/contract.ts`, `src/core/ppd040Preflight.ts`, `schemas/ppd.schema.json` | Skapa PPD 0.4.0, validera struktur och semantik, förhandla version och hantera begränsad äldre migration |
| Redigeringskommandon | `src/core/editor.ts`, övriga moduler i `src/core/` | Transaktioner, selektion, historik, geometri, layout, objekt och text |
| Användargränssnitt | `src/ui/EditorApp.tsx`, `src/editor/Renderer.tsx`, komponenter i `src/editor/` | React-ribbon, paneler, objektredigering och DOM/SVG-rendering utifrån modellen |
| Arbetskopior | `src/core/persistence.ts`, `src/core/persistenceController.ts` | IndexedDB, debouncerad lokal autosparning, versionskontroll och explicit återställning; ingen synk mellan enheter |
| Presentationsläge | `src/ui/PresentationSlide.tsx`, `src/core/playback.ts` | Visning, fragment, klickstyrda effekter, anteckningar och separat publikläge |
| Export | `src/export/exportController.ts`, `src/export/html.tsx`, `src/export/pdfWriter.ts`, `src/export/pptxWriter.ts` | Fristående HTML, PDF, PPTX, PNG/JPG samt format- och objektbaserade förlustvarningar |
| PWA | `src/pwa/client.ts`, `src/pwa/safety.ts`, `src/pwa/sw-template.js` | Installations-/offlineflöde och uppdateringssäkerhet; användarens arbetskopior hanteras inte i cachelagret |

## Modell, import och redigering

Filer med PPD-JSON eller HTML med en inert PPD-payload hanteras av `importDocument` i `src/core/contract.ts`: inläsning → format- och versionskontroll → struktur- och semantikvalidering → resurskontroller → läsbar/redigerbar modell eller ett begränsat skrivskyddsläge. Importerad HTML körs inte som programkod.

Nya dokument skapas med PPD 0.4.0. `src/core/contract.ts` innehåller verifiering för 0.3.1, migration av en specificerad 0.3.0-profil och begränsade 0.1/0.2-profiler genom `src/core/legacy.ts`. Detta är **inte** generell bakåtkompatibilitet. Läs även [PPD-kontraktet](ppd-contract.md).

Redigeringskommandon ändrar dokumentmodellen och dess revision. Renderern bygger visningen från modellen. Objekt som tillkommer som layoutplatshållare kan återanvändas mellan layoutbyten. Redigeringshistorik, paneler och markering är användargränssnittets tillstånd – inte delar av ett normaliserat PPD-publikformat.

## Arbetskopior och offline

`src/core/persistence.ts` använder IndexedDB-databasen `slide-fable-workspace`, version **1**, med lagring av kompletta dokumentmodeller i `drafts`. `saveDraft` utför versionsjämförelse och avvisar en inaktuell skrivare. `DraftPersistenceController` schemalägger debouncerad autosparning och håller ordning på sparade revisioner.

Det finns **ingen genomförd databasschemamigration över flera IndexedDB-versioner** i denna implementation. Versionerade migreringar och långsiktig lagringslivscykel är vidareutvecklingsbehov, inte en etablerad funktion. Användaren kan återställa hela lokala arbetskopior genom **Arkiv → Arbetskopior…**, men kan inte använda Ångra för att återgå från en sådan återställning. En HTML-export är den flyttbara säkerhetskopian.

PWA-versionen kan cachelagra appkod och resurser för offline-start. Den fristående HTML-exporten bygger i stället på en inbäddad dokumentmodell, resurser och en separat player som kan visas utan service worker och konto. Båda flödena behöver egna tester; stöd i Chromium motsvarar inte fullständigt godkännande på fysiska iOS-enheter.

## Exportarkitektur – faktiskt motorval

- **HTML:** `src/export/html.tsx` skapar en fristående visningsfil med PPD och inbäddade resurser; `src/core/playback.ts` bidrar med navigerings- och animationslogik.
- **PDF:** `src/export/pdfWriter.ts` använder `pdf-lib` och `@pdf-lib/fontkit`; text och enkla objekt exporteras där det stöds som egna PDF-objekt, andra egenskaper kan rasteriseras. Den genererade PDF:en kan innehålla bilagda källposter för diagram och formler.
- **PPTX:** `src/export/pptxWriter.ts` använder `pptxgenjs` med egna OOXML-anpassningar för källposter i `customXml`. Native former, text, tabeller och diagram används inom avgränsade scenarier. Fler effekter kan förlora redigerbarhet och rapporteras.
- **PNG/JPG:** `src/export/html.tsx` rasteriserar den valda bildmängden med `html-to-image` och paketerar filerna i ZIP.
- **Gemensam planering:** `src/export/plan.ts` klassificerar objekts förväntade exportrepresentation som native, hybrid, rasterized eller unsupported. `src/export/exportController.ts` väljer bilder och format, laddar ned fil och en separat JSON-rapport.

Avvikelser mellan redigerarens bild och Poppler-renderad PDF mäts dessutom diagnostiskt av `scripts/report_export_fidelity.mjs`, men det ersätter inte manuellt PowerPoint- eller PDF-läsarprov. Läs [exportpolicyn](export-policy.md) och [exporttäckningen](export-coverage.json).

## Säkerhet och drift

`src/core/contract.ts` innehåller URL-/SVG-kontroller, resursbudget och kanoniska hashberäkningar. Import- och exportunterlag får inte exekvera godtycklig användar-JavaScript. Säkerhetsprövning gäller hela import-/exportkedjan, inte bara schemastrukturen.

Statisk GitHub Pages-publicering sker först efter lyckad kandidatverifiering av aktuell `main`-commit, enligt `.github/workflows/verify.yml` och `.github/workflows/deploy-pages.yml`. Node krävs för byggning, inte för normal användning. Se [driftinstruktionerna](operations.md).

## Tidigare målarkitektur och öppna gränser

Den första designen beskrev DOM/SVG-rendering, en separat presentation-player, PDF via pdf-lib, PPTX via PptxGenJS och säker HTML-export som **föreslagna val**. Dessa motorer är nu implementerade i ovanstående moduler. Däremot är bland annat generell historisk formatmigration, databasschemamigration, full Office-paritet, självständig Safari-/iOS-acceptans och avancerad exportkomposition fortfarande öppna krav. Historiska beslut finns i [DEV-002:s tekniska beslut](dev002-technical-decisions.md); de ska inte användas som ersättning för den implementerade arkitekturen.
