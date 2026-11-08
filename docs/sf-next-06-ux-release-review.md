# SF-NEXT-06 – samlad UX-, funktions- och releasegranskning

**Datum:** 2026-11-08  
**Baslinje:** `slide-fable_SF-NEXT-05d_verified.zip` (369 poster), Slide Fable 0.5.0.  
**Arbetsläge:** PLAN/ASSESS. Ingen applikationskod har ändrats.

## Kort slutsats

Den nya redigeraren täcker flera centrala PowerPoint-arbetsuppgifter (bildordning, rik text, vanliga former, bildhantering, tabeller, tre diagramtyper, animationer, presentation, offlinearbetskopia och flera exportformat). De senaste SF-NEXT-04/05-stegen har dokumenterade automatiserade delprov. **Detta är inte liktydigt med fullständig produkt- eller releaseacceptans.**

**Två parallella spår behövs:** (1) minska friktion för vanliga redigeringsuppgifter; (2) stäng de befintliga normativa releasegrindarna. Håll isär funktionsbrist, testlucka och observerad defekt. `NOT_READY` behålls.

## Metod och evidensnivå

- Inspekterat `src/ui/EditorApp.tsx`, `src/editor/ObjectEditors.tsx`, ribbon-/panelkomponenter, testskript, utvecklingsplan, verifieringsrapporter och `docs/release-gates.json` i faktisk ZIP.
- Kontrollerat befintliga testskript för data-ribbon, dokumentfiler, paneler, PWA och exporter; SF-NEXT-05d:s två separata Agent Workspace-testkörningar rapporterar PASS men en enda sammanhängande full körning avbröts på tidsgräns.
- **Inget nytt live-UX-test, visuell skärmbild, Safari/iPad-test eller Office-test har utförts inom SF-NEXT-06.** Allt nedan är kodbelagd funktion/risk eller accepterad dokumenterad lucka, inte nyuppmätt användarfriktion.

## Arbetsflödesmatris

| Arbetsflöde | Faktisk implementation / evidens | Bedömning och kvarstående granskning |
|---|---|---|
| Skapa/duplicera/flytta/återanvänd bilder | `SlideFilmstrip`, `SlideOverview`, `slideOperations`, browser-prov | Relativt hög teknisk täckning; pek-/tangentbordseffektivitet på riktig iPad ej belagd |
| Redigera text och former | `RichEditor`, ribbons, geometri-, format- och ångrakommandon | Basflöden implementerade; full listtypografi, overflow och roterad avgruppering fortfarande öppna enligt release-review |
| Beskära/ersätta bilder | `ImageCropEditor`, bildinställningar, browser-prov | Implementerat; full referensjämförelse på flera bilder/exporter saknas |
| Redigera tabell | `TableEditor`: celltext, cellrubrik, kanter, kolumnbredd, cellmarginal, högermerge | **P1 UX-lucka:** sammanslagningens återgång/delning och komplexa spann är inte ett komplett vanligt arbetsflöde i formulärvägen; JSON för `Tabellceller` kvarstår |
| Redigera diagram | `ChartEditor`: namn, kategorier, värden, lägg till/ta bort/flytta och Ångra; `data-ribbon`-tester | Väsentligt förbättrat i 05b–05d; behåll JSON som expertläge snarare än ny huvudlösning |
| Diagram/avancerade objekt | `DiagramEditor`, `JsonField` för struktur, vektor, effekter, interaktioner | **P1/P2:** användaren behöver JSON för flera icke-tekniska redigeringsuppgifter; välj smal konkret åtgärd först |
| Design, master, layout | `DesignGallery`, `MasterLayoutEditor`, JSON för master/tema/komponentdefinitioner | Grundläggande redigering finns; avancerade layout-/komponentfall är delvis expertbaserade och ej fullacceptans |
| Presentation/animation | `AnimationPanel`, `RibbonMotion`, presentatörsläge | Automatiserade prov finns; faktisk tvåskärms- och fysisk iPad-acceptans saknas |
| Spara/återuppta | Lokal autosparstatus under namn, separat HTML-hämtning, återställningsprov | Tydligare än före 05a; mental modell »Spara« jämfört med PowerPoint behöver användartest |
| Export till PDF/PPTX | OOXML-/rasterregressioner 04b–04e, exportprofiler | Strukturella delar täcks; verklig Office-rendering, redigera/återspara samt oberoende PDF-läsare saknas |

## Prioriterade, verifierbara förbättringskandidater

### UX-06-01 — P1: Dela upp sammanslagen tabellcell utan JSON

**Evidens:** `src/editor/ObjectEditors.tsx` erbjuder `Sammanfoga →` men inte motsvarande formulärkommando för att dela upp cell. `src/ui/EditorApp.tsx` exponerar separat `JsonField` för `Tabellceller`. Detta är en *funktionell UI-lucka*, inte ett observerat runtime-fel.

**Nästa utvecklingssteg:** SF-NEXT-07a. Inför ett avgränsat ”Dela cell”-kommando för horisontellt sammanslagna celler (`colSpan>1`) med bibehållen rektangulär tabellstruktur, tydliga begränsningar för `rowSpan` och säker ID-hantering; vid tvetydig geometri ska åtgärden avvisas med begripligt UI-meddelande, inte korrumpera data.

**Acceptanskriterier:** (1) sammanfoga två vanliga grannceller; (2) dela igen och bevara det första cellinnehållet; (3) återställd kolumnstruktur, unika cell-ID:n och giltig PPD; (4) Ångra/Gör om; (5) persistens/reopen och exportkontroll för redigerbar PPTX-tabell; (6) Chromium desktop, iPad portrait och mobil; (7) felaktiga och gränsfall utan datatapp. Skriv karakteriseringstest före kodändring.

### UX-06-02 — P1: Panelbyten i ett sammanhängande arbetsflöde

**Evidens:** Responsive panelnavigation och separat `showProperties`/`panel`/`tab`-tillstånd i `EditorApp.tsx`; 03 korrigerade en konkret animationsingång. Senare browserprov verifierar många delmoment, men faktisk iPad-tangentbord/VoiceOver och komplett markering→format→canvas→bildbyte förblir ej slutattesterat.

**Åtgärd:** först ett sammanhängande Playwright-flöde för desktop/tablet/phone och tillgänglighetskontroll; rätta bara reproducerad defekt. Fysisk Safari separat.

### UX-06-03 — P2: Expert-JSON för icke-tekniska objektuppgifter

**Evidens:** `JsonField` finns för tabellceller, diagramdata, semantiska diagram, vektorer, formelkälla, effekter, interaktioner, läsordning, fragment och avancerad master/design. Flera områden har redan vanliga kontroller; ändra inte fungerande sådana i onödan.

**Åtgärd:** rangordna tre konkreta användaruppgifter (t.ex. tillämpa enkel objektinteraktion, ändra läsordning, dela sammanslagen cell) genom användartest och implementera högst en per steg. Säkerställ att avancerad JSON förblir expertläge och att båda vägarna ger samma modell/Ångra.

### UX-06-04 — P2: Förutsägbar filmodell och dokumentstatus

**Evidens:** Autosparad lokal arbetskopia skiljer sig från hämtad HTML och dialogerna förklarar det; den förbättrade indikatorn finns i 05a. **Risk, inte verifierat fel.**

**Åtgärd:** kort modererat test ”öppna HTML→ändra→spara→stäng→återöppna→dela” med minst en desktop- och en iPad-användare. Mät om användaren tror att originalfilen uppdaterats; förändra inte lagringskontrakt utan dokumenterat beslut.

## Releasegrindar – aktuell beslutsbild

Statuskolumnen nedan kommer från `docs/release-gates.json`; den är inte uppgraderad av SF-NEXT-06.

| Grind | Evidenstyp | Status i projektet | Nästa bevis |
|---|---|---|---|
| RG-001–004 | Automatisk kvalitet, livscykel, editor/export, PWA | PENDING (trots tidigare del-PASS) | Kör **ordinarie** CI på exakt leveransrevision, koppla logg/artefakt till varje grind och uppdatera attest endast med faktisk evidens |
| RG-005 | Manuell iPhone/iPad Safari | PENDING | Installera PWA; offlineomstart, lagring, touch, export och split view på riktig hårdvara |
| RG-006 | Manuell PowerPoint Mac+Windows | PENDING | Öppna/redigera/återspara testpresentation utan reparationsdialog; jämför layout |
| RG-007 | Manuell tillgänglighet/visuell trohet | PENDING | VoiceOver/skärmläsare, tangentbord och signerade referensbilder |
| RG-008 | Manuell fristående PDF-läsare | PENDING | Svensk text, sökning, tecken och sidformat i oberoende PDF-läsare |
| RG-009 | Blockerad historisk migrering | BLOCKED | Skaffa genuina PPD 0.1/0.2-filer och kontrakt; kör full säker migration |
| RG-010 | Manuell full kravacceptans | PENDING | Signera samtliga relevanta AT-201–218 och AT-301–310 med observerbara protokoll |

**Viktig avgränsning:** en användbar aktuell produktversion och historisk full 0.1/0.2-kompatibilitet kan vara två olika leveransmål; att formellt avgränsa en ny MVP utan full historisk migration kräver ett uttryckligt produkt-/kravbeslut och uppdaterad specifikation, inte tyst ändring av grindarna.

## Föreslagen ordning efter denna granskning

1. **SF-NEXT-07a:** avgränsad UI-förbättring ”Dela sammanslagen tabellcell” med regressioner och full byggverifiering. Inga andra UX-funktioner i samma steg.
2. **SF-NEXT-07b:** sammanhängande responsivt panel- och markeringstest; implementation enbart efter reproducerat fel.
3. **SF-NEXT-08:** faktisk releasegrindsinsamling: GitHub CI på leveransrevision samt separat iPad/Safari, Office och PDF. RG-009 kräver användarunderlag eller uttryckligt nytt scopebeslut.

## Verifiering av denna granskning

- Dokumentbaserad källinspektion, källhänvisningar och JSON-grindmatris; ingen kodändring eller nya runtime-anspråk.
- `scripts/verify_planning.py` och kontroll av slutligt ZIP-arkiv ska köras efter dokumentationsuppdatering.
- SF-NEXT-06 betyder **avslutad analys**, inte godkänd release. `NOT_READY` kvarstår.
