# UX-17 – Tvärgående granskning av vanliga arbetsflöden

**Avstämningsdatum:** 2026-11-13  
**Inspekterad kodbas:** `main` `b54898f83b98b29892b1514ee01f48f6314c1dc4` efter UX-16 / PR #175.  
**Metod:** Statisk granskning av nuvarande GitHub-källkod, testskript, releasegrindar och aktuell GitHub Actions-status. Ingen ny browserkörning, fysisk enhetstestning eller Office-verifiering ingår i denna granskning.

## Slutsats

UX-09–UX-16 har fyllt flera konkreta luckor för diagram och tabeller. Nästa steg bör **inte** vara ytterligare en fristående tabellfunktion. Det mest värdefulla utvecklingsarbetet är ett sammanhängande regressionstest av huvudflödet, med endast reproducerade defekter åtgärdade efteråt.

Den senaste verifieringen av `main` var **pågående** när granskningen startade. Tidigare PASS är inte ett automatiskt godkännande av denna revision. Projektets releasebedömning förblir `NOT_READY`.

## Granskade arbetsflöden och evidens

| Arbetsflöde | Befintlig kod/testevidens | Kvarstående fråga eller risk | Klassificering |
| --- | --- | --- | --- |
| Skapa, välja, flytta, duplicera och dölja bilder | `src/ui/SlideFilmstrip.tsx`; meny med alternativ, flytt och drag-and-drop. `tests/panel-workflow-browser.mjs` provar bildbyte/panelbyte. | Kombinera bildordning med efterföljande redigering och presentationsläge i ett enda test. Fysisk iPad/touch återstår. | Testlucka |
| Redigera objekt genom ribbon och egenskapspanel | `src/ui/EditorApp.tsx`, `src/ui/RibbonDataTools.tsx`, `tests/panel-workflow-browser.mjs`. | Samma redigerarkomponent används på två ytor; kontrollera att användarens val, panelstängning och Ångra/Gör om förblir förutsägbara vid växling mellan dem. | Integrationsrisk, inte verifierad defekt |
| Tabell och diagram | `src/editor/ObjectEditors.tsx`, `tests/table-split-browser.mjs`, `tests/diagram-editor-browser.mjs`; UX-09–16. | Tillägg, borttagning, kopiering och flytt har många enskilda prov. Ett sammanhängande användningsfall med flera strukturändringar, spara/återöppna och export bör tillkomma. | Testlucka |
| Lokal arbetskopia och filhämtning | `src/ui/EditorApp.tsx`, `tests/document-file-browser.mjs`, `tests/lifecycle-browser.mjs`. | Nedladdad HTML-fil är inte samma sak som lokal arbetskopia. Kod och test dokumenterar skillnaden, men faktisk begriplighet behöver användartest. | UX-risk, ej bekräftat fel |
| Presentation och animation | `src/ui/PresentationSlide.tsx`, `tests/motion-ribbon-browser.mjs`. | Testa efter en redigeringssekvens att rätt bild presenteras och att användaren kan återgå till samma redigeringssammanhang. Verkliga Safari-/tvåskärmsprov återstår. | Testlucka |
| PDF-/PPTX-export | `tests/export-geometry-parity-browser.mjs`, `tests/export-data-parity-browser.mjs`, `tests/export-advanced-data-browser.mjs`. | Befintliga exportprov täcker valda objekt/format, inte hela kedjan från interaktiv flerstegsredigering till återöppning och extern Office-rendering. | Testlucka |
| PWA/offline | `tests/pwa.mjs`, `docs/release-gates.json`. | Fysisk Safari-installation, offlineomstart och lagringsbeteende är uttryckligen öppna manuella grindar. | Acceptanslucka |

## Prioriterad fortsättning

### UX-18 – Sammanhängande redigering → spara/återöppna → presentera → exportera (P1)

Skapa **ett browserbaserat end-to-end-regressionstest** som använder samma dokument genom hela flödet i Chromium för desktop (1440×900), iPad portrait (820×1180) och mobil (390×844).

1. Skapa en ny bild och ett form-/textobjekt. Kontrollera markering, egenskapspanel och minst en formatändring.
2. Lägg till tabell och utför minst en strukturell ändring. Kontrollera Ångra/Gör om och att alla cell-ID:n förblir unika.
3. Byt bild och återgå. Säkerställ att objektet och formateringen är oförändrade.
4. Spara en separat HTML-kopia, verifiera inbäddat PPD och återöppna den genom det stödda dokumentflödet (utan att förväxla lokal arbetskopia och nedladdad fil).
5. Öppna presentation från aktuell bild; kontrollera faktisk, synlig visningsyta och återgång till redigeraren.
6. Exportera PDF/PPTX och kontrollera relevanta strukturella invarianta egenskaper, utan att påstå full Office-renderingsparitet.
7. Testa alla tre viewport-varianterna och logga vilken del som fallerar; lägg inte till ny funktionalitet innan en reproducerad defekt finns.

**Acceptans:** full körning PASS i ordinarie kandidat-CI på PR-commit, dokumenterad testavgränsning, inga oväntade dokumentmutationer, fungerande Ångra/Gör om och inga JavaScript-konsolfel. Om testet hittar en faktisk defekt: gör en separat avgränsad fix med regressionsevidens.

### UX-19 – Begrepp och utrymme i tabell-/diagramredigerare (P2)

Följ upp genom riktat användarprov på desktop/iPad: välj tabell, växla mellan ribbon-popover och egenskaper, utför samma redigeringsuppgift. Bedöm först därefter om UI behöver slås ihop eller om en av ytorna ska vara primär. **Ingen generell panelombyggnad nu.**

### Releaseacceptans – separat spår

`docs/release-gates.json` anger fortfarande RG-001–004 som `PENDING`, RG-005–008 och RG-010 som manuellt `PENDING` samt RG-009 som `BLOCKED`. Stäng inte grindar enbart utifrån historiska gröna CI-resultat. Prioritera verkliga iPad/iPhone Safari-prov, PowerPoint Mac/Windows, tillgänglighet och oberoende PDF-kontroll när underlag finns.

## Avslutskriterium för UX-17

- Tvärgående kod- och testtäckning inventerad och klassificerad som **belagd funktion**, **testlucka**, **UX-risk** eller **acceptanslucka**.
- Ett prioriterat nästa genomförbart steg (UX-18) med testbara kriterier.
- **Ingen applikationskod, releasegrind eller historisk teststatus förändrad**.
