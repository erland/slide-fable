# DOC-AUDIT-03 – funktioner, responsiv UX och acceptans

**Kontrollerad källa:** `main` `72c8661765977f1d7e1033ad4ad6543104e1872a`, 2026-11-12, före denna dokumentations-PR. **Avgränsning:** kod- och dokumentationsjämförelse. Inga nya fysiska Safari-, PowerPoint- eller PDF-läsartester har utförts. Ingen körbar programkod ändras.

## Fynd och genomförda rättningar

| Område | Belagd skillnad | Källor och åtgärd |
| --- | --- | --- |
| Funktionell specifikation | Den inledande versionstexten och äldre SF-COMMON-krav kunde uppfattas som aktuell acceptans, medan implementeringsmatrisen bara var avstämd efter PR #119 | `docs/functional-specification.md`, `src/ui/EditorApp.tsx`, `src/core/designGallery.ts`, `src/export/exportController.ts`: bevarat normativa krav och lagt till separat 2026-11-12-matris med status och testbelägg. |
| Arbetskopior och Ångra | Tidigare start-/återställningsflöde hade ersatts av Arkiv-dialog och uttrycklig bekräftelse | `src/ui/EditorApp.tsx`, `src/core/persistence.ts`, `tests/lifecycle-browser.mjs`, `tests/editor-browser.mjs`: uppdaterat funktionsprofilen. |
| Layouter | Återkommande växling mellan Innehåll och Två kolumner återanvänder nu layoutstyrda objekt i stället för att växa okontrollerat | `src/core/designGallery.ts`, `tests/design-gallery.test.mjs`: dokumenterat identifierad delmängd och begränsningen att gamla dubbletter inte rensas automatiskt. |
| Responsiv UX | `docs/responsive-ux.md` beskrev en ren dator/tablet/telefon-matris och kommande designpilot; faktisk CSS använder flera överlappande brytpunkter, ett valbart panelgränssnitt och redan implementerat tema | `src/ui/editor.css`, `src/ui/EditorApp.tsx`, `tests/panel-workflow-browser.mjs`: ersatt med implementerat beteende samt tydliga återstående enhetskrav. |
| Historiskt UX-fynd | UX-02-01 beskrev ett fel där animationskommandot inte öppnar dold panel; koden använder nu `openProperties('animations')` och testar beteendet | `docs/ux-review-sf-next-02.md`, `src/ui/EditorApp.tsx`, `tests/motion-ribbon-browser.mjs`: markerat det daterade fyndet som åtgärdat i senare kod. |
| Presentation | Presentationsskalning och webbläsartester har ändrats efter den äldre funktionsavstämningen | `src/ui/PresentationSlide.tsx`, `src/core/playback.ts`, `tests/motion-ribbon-browser.mjs`: dokumenterat stöd och kvarvarande tvåskärms-/Safari-begränsningar. |
| Releasegrindar | Den gamla releaseöversikten återger en historisk DEV-/AT-matris; maskinfilen anger fortfarande PENDING/BLOCKED även när kandidat-CI har lyckats | `docs/release-review.md`, `docs/release-gates.json`, `STATUS.md`: förtydligat skillnaden mellan testad commit och formellt stängd releasegrind. Ingen status ändrad utan nytt acceptansunderlag. |

## Resultat och säkerhetsgräns

- **Implementerat:** Kodvägar finns för responsiva paneler, arbetskopior, layout, grundläggande presentation och export.
- **Automatiskt verifierat inom delmängd:** Chromium- och enhetstester kontrollerar definierade beteenden och storlekar. Dessa är inte bevis för generell kompatibilitet eller kvalitet i alla webbläsare.
- **Manuellt öppet:** RG-005 fysisk Safari/iPad/iPhone, RG-006 PowerPoint, RG-007 tillgänglighet och visuell acceptans, RG-008 oberoende PDF-läsare, RG-010 fullständiga funktionskrav.
- **Historisk formatmigration:** RG-009 är fortsatt blockerad av brist på autentiska historiska provfiler. 
- **Automatiska grindar:** RG-001–004 står `PENDING` i `docs/release-gates.json` och har inte automatiskt markerats `PASS` bara för att vissa tidigare CI-körningar lyckats.

Den ursprungliga kravspecifikationen behålls. En funktions existens är **inte** liktydig med releasegodkännande. Projektets sammanlagda bedömning förblir `NOT_READY`.

## Fortsättning

**DOC-AUDIT-04:** Inventera historiska etapp- och beslutsrapporter, kontrollera samtliga interna dokumentlänkar och filreferenser, och skilj kvarvarande daterade statusuppgifter från aktuell projektstatus. Bevara sakligt historiska testresultat utan att skriva om tidigare belägg.
