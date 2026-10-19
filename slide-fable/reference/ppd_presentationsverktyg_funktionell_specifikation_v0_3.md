# PPD Studio v0.3 – funktionella kompletteringar för utökad objektkatalog

**Status:** förslag. **Beroende:** PPD v0.3 och `ppd.schema.json`. **Datum:** 2026-10-19.

## 0. Funktionella krav v0.3 (gäller före äldre v0.2-text nedan)

### Objektredigering och arbetsflöden

| Krav | Prioritet | Förväntat användarbeteende |
|---|---|---|
| S-301 Semantiska diagram | MVP | Infoga process/hierarki/tidslinje, redigera noder och kanter, byt layout utan förlust av innehåll |
| S-302 Ekvation | MVP | Skriv LaTeX/MathML, förhandsgranska, ange alternativtext, redigera källan senare |
| S-303 Vektorbana | MVP | Infoga säker SVG eller rita bana; skala och färgsätt utan rasterisering |
| S-304 Frihandsritning | Nästa | Pennverktyg, färg, tjocklek, radera stroke, tryckbevarande import |
| S-305 Interaktion | Nästa | Tilldela enkel åtgärd till form/bild/text, testa i presentationsläge |
| S-306 Avancerad text | Nästa | Text längs bana och dekorativ warping, med fortsatt redigerbar textkälla |
| S-307 Mediekontroll | Nästa | Infoga ljud/video, välj poster, uppspelning, captions, muting/loop |
| S-308 Bildgalleri | Nästa | Återanvändbar komponent med layout och presentationsnavigering |
| S-309 3D-modell | Senare | Placera GLB/glTF, välj kameravinkel och poster, hantera säkerhetsbegränsningar |
| S-310 Inbäddade dokument | Senare | Bifoga icke exekverat dokument med poster och länk/nedladdning |
| S-311 Kodblock | Nästa | Syntaxmarkering och korrekt escaping, ingen exekvering |
| S-312 Kartobjekt | Senare | GeoJSON med attribution och statisk exportfallback |
| S-313 Diagramtyper | Nästa | Utöka datavisning utan att ändra grundläggande datasetsemantik |
| S-314 Exportinsyn | MVP | Förhandsvisa och ladda ned objektrapport för HTML/PDF/PPTX och val av fallback |

### Exportkontrakt för nya objekt

- **HTML:** bevara kanonisk payload, offline-resurser, redigerbar källa och tillgänglig fallback. Visa inte skadligt inbäddat skript.
- **PDF:** rendera statisk representation med källtext, alt-text där exportmotorn stödjer det; videor, interaktion och 3D använder poster, eventuellt länk.
- **PPTX:** prioritera verkliga PowerPoint-former och texter för diagram; ekvation native när kompatibelt, annars SVG/EMF eller bild; bevara redigeringskälla i dokumentmetadata i den mån det är praktiskt. Låt användaren välja editable-first, visual-first eller flattened.
- **Ingen tyst funktionsförlust:** visa explicit per-objekt-rapport. Textsemantik ska finnas kvar i PPD även när ett PDF/PPTX-objekt rasteriseras.

### Kvalitetsgrindar / acceptans

| Test | Givet – när – då |
|---|---|
| AT-301 | Ett tvåstegsprocessdiagram byter layout och återöppnas; noder, relationer och id bevaras |
| AT-302 | En LaTeX-formel ändras och exporteras; renderad bild och källan är konsistenta |
| AT-303 | Säker SVG infogas och exporteras; farlig SVG avvisas med konkret felmeddelande |
| AT-304 | En deklarativ interaktiv knapp navigerar korrekt och exporteras med fallbackvarning i PDF |
| AT-305 | En 3D-modell utan viewer använder poster; ingen tom yta i PDF/PPTX |
| AT-306 | En PPTX innehåller redigerbara diagramformer och text där policy säger native; annat redovisas |
| AT-307 | Enfil-HTML fungerar offline inklusive typsnitt, diagram och formelrendering |
| AT-308 | Import/export av v0.2-dokument via migration ändrar inte befintlig semantik eller bildordning |
| AT-309 | Inbäddad kod/extern URL exekveras aldrig utan tillåten explicit handling |
| AT-310 | Obehandlat okänt objekt med fallback visas men markeras som delvis redigerbart |

### Utvecklingsordning och beslutspunkter

1. MVP: semantiska diagram, formler, vektorbanor, validering, fallback och exportinsyn; bibehåll tidigare MVP-funktioner i v0.2.
2. Nästa: frihandsritning, actions, media och kodblock, bildgallerier, fler diagram.
3. Senare: 3D, kartor, inbäddade externa objekt och avancerad interaktivitet.
4. Beslut före implementering: MathML/LaTeX-säker delmängd, SVG-sanitizer, offline-fontpolicy, vilka PPTX-native-objekt som stöds av valda exportbibliotek och hur osupportade effekter rasteriseras.

---

## Tidigare v0.2-specifikation (fortsatt giltig där den inte ersätts ovan)

# Funktionell specifikation – PPD Presentationsverktyg

**Version:** 0.2 (förslag)  
**Status:** Underlag för utveckling och acceptanstest  
**Datum:** 2026-10-19  
**Kompletterar:** `presentationsformat_forslag_v0_2.md` (PPD, schemaförslag 0.1)  
**Arbetsnamn för produkten:** PPD Studio

> Detta dokument definierar användarupplevelse, funktionella krav, exportkontrakt, kvalitet och avgränsningar. Formatspecifikationen definierar dokumentets data. Vid konflikt ska avvikelsen dokumenteras; formatkontrakt får inte ändras tyst för att passa implementationen.

> **Läsanvisning v0.2:** Den ursprungliga v0.1-texten finns kvar för spårbarhet. Avsnitt 16 och senare utgör den **normativa v0.2-kompletteringen** och har företräde vid prioriteringskonflikter. Specifikationerna är utvecklingsunderlag, ännu inte fastställda standarder eller fullständiga JSON Schema.

## 1. Sammanfattning och mål

PPD Studio ska vara ett kostnadseffektivt, webbaserat presentationsverktyg som **läser, skapar, redigerar, visar, sparar och exporterar** presentationer enligt PPD-formatet. En PPD-presentation ska kunna distribueras som **en enda självförsörjande HTML-fil** med kanonisk maskinläsbar modell och nödvändiga resurser inbäddade. En exporterad fil ska kunna öppnas offline, presenteras och återimporteras för vidare redigering.

**Målgrupper:** allmänna presentationsskapare, kommunikatörer, verksamhetsutvecklare, arkitekter, utbildare och användare som vill ha både modern grafisk kvalitet och semantiskt återanvändbart innehåll.

**Produktprinciper:**

1. **Innehållet först:** PPD-modellen är sanningskälla; renderad HTML är en genererad representation.
2. **Visuell kvalitet:** premiumdesign, fotorealistiska bakgrunder, transparenta lager, blur, gradienter och skuggor utan att offra läsbarhet.
3. **Vanlig presentationslogik:** det som användare förväntar sig av PowerPoint ska vara lätt att hitta och använda.
4. **Portabilitet:** presentationer fungerar offline och utan konto; extern molnlagring är frivillig.
5. **Tydliga kompromisser:** export till andra format ska redovisa om något förenklats eller rasteriserats.
6. **Låga kostnader:** local-first och valbara beroenden; ingen obligatorisk betaltjänst.

## 2. Avgränsningar och prioritet

Kravprioritet: **M = MVP**, **B = nästa leverans**, **F = framtida**. MVP ska ge ett sammanhängande flöde från import till export, inte enbart en demo.

**MVP:** läsa och skriva PPD-HTML, skapa från tomt dokument/mall, redigera vanliga objekt, bild- och glasbakgrunder, enskild presentationsvisning med navigering, PDF-export, PPTX-export med definierad miniminivå av redigerbarhet, exportlogg och automatiska acceptanstester.

**B:** diagramredigering med datatabell, talaranteckningar/presentatörsvy, grupperade objekt, temamallar, flera PDF-profiler, anteckningar och förbättrade PPTX-effekter.

**F:** fleranvändarredigering, kommentarer, molnsynk, AI-assisterad design, PowerPoint-import, videoredigering och avancerad interaktivitet.

**Ej mål för MVP:** pixelperfekt PPTX-paritet med webbläsaren; import av godtyckliga `.pptx`; makron/VBA; fullständigt stöd för alla Reveal.js-tillägg; att kunna redigera enskilda föremål i ett fotografi; automatisk AI-bildgenerering utan ansluten tjänst.

## 3. Grundläggande användarresor

| ID | Scenario | Förväntat resultat | Prioritet |
|---|---|---|---|
| UF-01 | Öppna befintlig PPD-HTML | Struktur, bilder, texter, effekter, ordning och anteckningar återskapas | M |
| UF-02 | Skapa ny presentation | Välj format, mall/tema och lägg till bilder | M |
| UF-03 | Redigera slide | Välj, flytta, ändra och ordna objekt med direkt visuell återkoppling | M |
| UF-04 | Förhandsgranska | Presentera i helskärm med tangentbord och touch | M |
| UF-05 | Spara projekt | Ladda ned ny självförsörjande HTML som går att återöppna | M |
| UF-06 | Exportera PDF | Samtliga bilder blir läsbara sidor i rätt proportioner | M |
| UF-07 | Exportera PowerPoint | Bilder blir PPTX-bilder med redigerbara standardobjekt där möjligt | M |
| UF-08 | Byta tema | Innehåll och referenser bevaras, design uppdateras | B |
| UF-09 | Arbeta med diagramdata | Ändra dataset och uppdatera visualisering | B |
| UF-10 | Samarbeta | Dela och samredigera projekt med andra | F |

## 4. Applikationens arbetsytor

### 4.1 Start/filhantering
- **KR-001 [M]:** Ny presentation från blankt dokument eller minst tre inbyggda mallar (titel, innehåll, process).
- **KR-002 [M]:** Importera lokal `.html` med PPD-markör och validera den kanoniska modellen före redigering.
- **KR-003 [M]:** Vänlig felrapport för felaktigt format, saknade resurser, versionskonflikter och trasiga referenser; ingen tyst databortfall.
- **KR-004 [M]:** Visa dokumenttitel, revisionsnummer, ändringsstatus och senaste sparade tid *i aktuell session*.
- **KR-005 [B]:** Stöd valfri projektkatalog och projektpaket för utvecklingsflöden; HTML-enfilsexport är fortfarande obligatorisk.

### 4.2 Redigeringsvy
Layouten bör ha **bildlista till vänster**, **arbetsyta i mitten**, **egenskapspanel till höger** och **verktygsrad upptill**. Mindre skärmar får en alternativ panelbaserad vy.

- **KR-010 [M]:** Visa miniatyrer, lägg till, duplicera, ta bort och ändra ordning på bilder.
- **KR-011 [M]:** Markera ett eller flera objekt, flytta genom drag, ändra storlek, rotera, duplicera och ta bort; synliga markeringshandtag.
- **KR-012 [M]:** Ordna lager: framåt, bakåt, överst, underst; visa/dölj och lås/lås upp objekt.
- **KR-013 [M]:** Editera rubriker, vanlig text, listor och textformat utan att semantiska referenser (`contentRef`) bryts.
- **KR-014 [M]:** Visa stödlinjer, rutnät, fästning mot kanter/objekt och justeringskommandon.
- **KR-015 [M]:** Fyllning, linje, rundade hörn, opacitet, gradient, skugga och bildbeskärning ska gå att konfigurera på relevanta objekt.
- **KR-016 [M]:** Stöd zoom, panorering, fit-to-screen, ångra/gör om och standardkortkommandon.
- **KR-017 [M]:** Sidans storlek/proportion, säker marginal och vald bakgrund ska kunna ändras.
- **KR-018 [M]:** Återge element av samma typ konsekvent i redigerare, presentationsläge och HTML-export.
- **KR-019 [B]:** Gruppera/avgruppera objekt och hantera nästlade grupper.
- **KR-020 [B]:** Slide- och temamallar med ärvda stilar samt valbar lokal override.
- **KR-021 [B]:** Objektträd med namngivning, sökning, tillgänglighetsordning och gruppering.

### 4.3 Vanliga objekt och stödmatris

| Objekt | Skapa/redigera MVP | HTML | PDF | PPTX |
|---|---|---|---|---|
| Rubrik, textruta, stycke och punktlista | Ja | Text | Text | Native textruta |
| Rektangel, ellips, linje, pil, enkel polygon | Ja | Vektor/CSS | Vektor där möjligt | Native form |
| Foto/bild med beskärning och alt-text | Ja | Bild | Bild | Bildobjekt |
| Ikon (säker SVG) | Ja | SVG | Vektor/raster | Vektor om möjligt, annars bild |
| Länk | Ja | Klickbar | PDF-länk där möjligt | Länk där möjligt |
| Tabell | Enkel i MVP | HTML-tabell | Tabell | Native tabell |
| Diagram (stapel, linje, cirkel) | B; MVP får läsa och visa befintligt | SVG/Canvas | Vektor/raster | Native diagram i B; MVP raster med varning |
| Nyckeltal/callout | Ja (komposition av objekt) | HTML/CSS | Text/former | Text/former |
| Grupper/nästlade objekt | B | Strukturerade lager | Visuell grupp | Grupper om stöds |
| Ljud/video | F (visning i B) | Inbäddad/extern explicit | Posterbild | Media/fallback |
| Animationer, fragment och övergångar | Enkel fade i MVP | CSS/Reveal | Statisk slut-/startvy | Native om möjligt, annars statisk |
| Fotorealistisk bakgrund | Ja | Rasterbild | Rasterbild | Bildbakgrund |
| Glas/blur, ljuseffekter, avancerade masker | Ja | CSS-baserat | Renderad effekt | Rasteriserat effektlager + redigerbar text |

**Exportregel:** PPTX ska prioritera separat redigerbara texter, former och bilder. Avancerade effekter får rasteriseras som dekorativa lager med en dokumenterad fallback; användaren ska kunna se detta före export.

### 4.4 Design och teman
- **KR-030 [M]:** Temapalett, typografisk skala, bakgrunder och återanvändbara stilinställningar.
- **KR-031 [M]:** Effektredigering med förhandsvisning: opacity, gradient, blur, backdrop-filter, shadow, border, overlay.
- **KR-032 [M]:** Stöd både helt redigerbara objekt och hybridkompositioner (rasteriserat effektlager, redigerbara texter).
- **KR-033 [M]:** Visa indikator när en viss effekt inte väntas följa med som redigerbart objekt till PPTX.
- **KR-034 [B]:** Gemensamma masterlayouter, designvariabler och återanvändbara komponenter.

### 4.5 Semantik och tillgänglighet
- **KR-040 [M]:** Bildtitel, syfte, huvudbudskap, sektion och anteckningar kan granskas/redigeras i separat semantikpanel.
- **KR-041 [M]:** Objekt har stabila ID:n; textobjekt har relation till semantiskt innehåll där sådan relation finns.
- **KR-042 [M]:** Alternativtext för meningsbärande bilder och dekorativ-markering för icke-informativ grafik.
- **KR-043 [M]:** Läsordning och tangentbordsnavigation för presentationen; kontrastvarning på text mot bakgrund.
- **KR-044 [B]:** Export av presentationsöversikt i maskinläsbar text och utökad tillgänglighetsgranskning.

## 5. Presentation och visning
- **KR-050 [M]:** Presentation i helskärm eller fönster; navigering framåt/bakåt med piltangenter, klick och touch.
- **KR-051 [M]:** Förbli offline efter att den fristående HTML-filen öppnats; inga nödvändiga nätverksresurser.
- **KR-052 [M]:** Respektera bildens referenskoordinater och proportioner, med letterbox hellre än beskärning av innehåll.
- **KR-053 [M]:** Stöd enklare inträdesanimation och statiskt reservläge om reducerad rörelse är aktiverad.
- **KR-054 [M]:** Dölj redigeringskontroller när man presenterar.
- **KR-055 [B]:** Presentatörsvy med aktuella/nästa bild, anteckningar, timer, bildräknare och översikt.
- **KR-056 [B]:** Stegvis reveal/fragment, övergångstyper och per-objekt animationstidslinje.
- **KR-057 [B]:** Direktlänk till bild där webbadress används, utan att skada offlinepresentationen.

## 6. Spara, öppna och versionshantera

### 6.1 Kanoniskt format
- **KR-060 [M]:** Spara som enda `.html` med `format: "ppd"`, `schemaVersion`, `document`, `theme`, `slides`, `assets`, `presentation`, `provenance`, `build` enligt formatspecifikationen.
- **KR-061 [M]:** Samtliga för visning nödvändiga skript, stilar, fonter och bilder måste vara inbäddade lokalt (t.ex. data-URI eller binära paket representerade i HTML).
- **KR-062 [M]:** En sparad PPD-HTML ska både kunna presenteras direkt och återimporteras utan nätverksanslutning.
- **KR-063 [M]:** Spara ändringar i den kanoniska modellen först och regenerera härledd vy; undvik två osynkroniserade sanningskällor.
- **KR-064 [M]:** Uppdatera revision och ändringsmetadata; skilj `schemaVersion` från dokumentrevision och buildversion.
- **KR-065 [M]:** Verifiera referenser, tillgångar och schema före sparande. Erbjud tydliga fel och åtgärdsförslag.
- **KR-066 [M]:** Varna om osparade ändringar och erbjud nedladdning; gör inte anspråk på att kunna skriva över en lokal fil utan rätt användarbehörighet.
- **KR-067 [B]:** Lokal autosparning till IndexedDB/liknande med tydlig status; export av ny HTML kvarstår som portabelt sparande.
- **KR-068 [B]:** Lättviktig versionshistorik och formatmigration med säkerhetskopia.

### 6.2 Kompatibilitet och felhantering
- **KR-070 [M]:** Läsaren ska deklarera stödd schemaversion och obligatoriska funktioner (`featureRequirements`).
- **KR-071 [M]:** En nyare fil med okända obligatoriska funktioner får inte skrivas om destruktivt; öppna i begränsat läsläge eller stoppa med tydligt besked.
- **KR-072 [M]:** Bevara okända, icke-kritiska namnrymdade `extensions` vid normal öppna/spara om säkert möjligt; rapportera annars förlust före export.
- **KR-073 [M]:** Otillåtna skript/HTML från modell, extern resursåtkomst och osäkra SVG-element ska saneras eller blockeras.

## 7. Exportfunktioner

### 7.1 Gemensamt exportflöde
1. Användaren väljer **Exportera** och format.
2. Verktyget visar alternativ, omfattning (alla bilder/urval), bildformat och kvalitetsprofil.
3. En förhandskontroll listar risker: överskjutande text, saknade resurser, oläsbar kontrast, typsnittssubstitution och rasteriserade objekt.
4. Verktyget renderar/exporterar med definierad version av motorn.
5. Användaren får filen och en exportrapport med varningar och eventuella avvikelser.

**KR-080 [M]:** Exporten får inte tyst utelämna objekt. Varje typ som inte stöds ska få definierad fallback eller blockeras med begripligt fel.

### 7.2 Fristående HTML – PPD
- **KR-081 [M]:** `.html` exporteras med full PPD-modell, renderad vy och resurser, utan obligatoriska CDN-länkar.
- **KR-082 [M]:** HTML ska fungera efter `file://`-öppning i moderna webbläsare; kontrollera speciellt Safari och Chromium.
- **KR-083 [M]:** HTML-import → redigering → HTML-export → återimport ska behålla innehåll, ID:n, lager och referenser.
- **KR-084 [M]:** Enbart användarinitierad nedladdning av en ny HTML-fil krävs. Inbyggt redigeringsläge i den exporterade filen är valbart i MVP; modellen ska ändå följa med.

### 7.3 PDF
- **KR-090 [M]:** Exportera till PDF med en sida per presentationsbild och korrekta proportioner (16:9 som standard).
- **KR-091 [M]:** Behåll text som sökbar/markerbar text och vektorer där möjligt; tillåt raster för effekter/bakgrunder.
- **KR-092 [M]:** Bilder får inte beskäras felaktigt och text får inte gå utanför angivna gränser utan varning.
- **KR-093 [M]:** Hyperlänkar och dokumentmetadata ska inkluderas där tekniken stödjer det.
- **KR-094 [M]:** Exporten ska använda dokumenterad renderingsmiljö (rekommenderat låst Chromium-version) för reproducerbarhet; offlinefunktion ska inte kräva en server för att *visa* HTML.
- **KR-095 [B]:** Sidurval, utskrift med anteckningar, handout-layouter och valbar tillgänglighetsprofil.

### 7.4 PowerPoint (`.pptx`)
- **KR-100 [M]:** Skapa en giltig öppningsbar `.pptx` i samma bildordning och med samma sidproportioner.
- **KR-101 [M]:** Textobjekt, grundformer, pilar, linjer, och bilder exporteras som **redigerbara native PowerPoint-objekt** där objektet stöds av MVP-mappningen.
- **KR-102 [M]:** Lagerordning, placering, storlek, färg, opacitet, text och basala länkar ska bevaras inom rimliga toleranser.
- **KR-103 [M]:** Glas-, blur- och ljuseffekter får bli **separata rasteriserade stödytor** utan att bakomliggande texter plattas till.
- **KR-104 [M]:** Objekt som rasteriseras ska redovisas per bild/objekt i exportrapporten; rapporten ska beskriva effekt på redigerbarhet.
- **KR-105 [M]:** Diagram och tabeller ska ha en publicerad kompatibilitetsmatris. Enkel tabell exporteras som native tabell; diagram får i MVP rasteriseras med varning och förbli semantiskt tillgängliga i PPD-originalet.
- **KR-106 [M]:** Exporten ska kunna öppnas i aktuell PowerPoint för Mac och Windows; funktionstest ska inkludera faktisk ändring av text och form efter export.
- **KR-107 [M]:** PPD-HTML förblir redigerbart original. Återimport av ändrad `.pptx` ingår **inte** i MVP, och ändringar där synkroniseras inte automatiskt tillbaka.
- **KR-108 [B]:** Exportera vanliga stapel-, linje- och cirkeldiagram som native PowerPoint-diagram när datamodell stöds.
- **KR-109 [B]:** Exportera enkla övergångar, anteckningar och grupper i PowerPoint-format.

**Fidelity-profiler (föreslagna):**
- **Editable-first (standard):** maximal objektsredigerbarhet, avancerade visuella effekter approximeras.
- **Visual-first:** rasteriserade dekorativa lager för bättre utseende; texter och centrala informationsobjekt fortsatt redigerbara där möjligt.
- **Flattened:** helsidesbild per slide som sista reservväg, alltid med tydlig varning om att redigerbarhet går förlorad.

## 8. UX-flöden och interaktion

### Ny presentation
1. Välj tom/tema → ange titel och bildformat → skapa första bilden.
2. Lägg till rubrik, bild, form, tabell → ändra egenskaper → spara HTML.
3. Förhandsgranska → exportera PDF/PPTX.

### Öppna och redigera befintlig presentation
1. Välj `.html` → parse/säkerhetsvalidera PPD-modell → visa bildlista.
2. Välj objekt → ändra text/färg/storlek eller bild → förhandsgranska.
3. Exportera ny HTML → återöppna och verifiera att ändringarna består.

### Export med fallback
1. Användaren väljer `.pptx` → systemet listar ett glasobjekt som inte kan exporteras native.
2. Användaren väljer Editable-first eller Visual-first.
3. PPTX skapas och exporterad rapport anger exempelvis `slide-02/glass-panel: rasterized visual effect; heading remains editable`.

## 9. Icke-funktionella krav

| ID | Krav | MVP-riktvärde / kontroll |
|---|---|---|
| NFR-01 | Offline | Exporterad PPD-HTML visar alla bilder med nätverket avstängt |
| NFR-02 | Portabilitet | En enda HTML-fil ska vara tillräcklig för visning och återimport |
| NFR-03 | Prestanda | Vanlig 20-bilders presentation ska kunna navigeras responsivt på modern laptop; mät och fastställ budget i pilot |
| NFR-04 | Format | Utförligt schema + strukturell validering + versions- och feature negotiation |
| NFR-05 | Säkerhet | Sanerad input, ingen exekvering av dokumentinbäddad användarkod, resurspolicy, CSP i möjligaste mån |
| NFR-06 | Tillgänglighet | Tangentbordsstyrning, tydliga fokuslägen, alt-textstöd, reduced motion, kontrastgranskning |
| NFR-07 | Kompatibilitet | Senaste stabila Chrome/Edge/Firefox/Safari; export-PDF via definierad Chromium |
| NFR-08 | Robusthet | Avbruten export eller ogiltig fil får inte skada den aktuella arbetskopian |
| NFR-09 | Tester | Deterministiska enhets-/integrations-/e2e-tester och visuell regression |
| NFR-10 | Datahantering | Lokal behandling som standard; ingen serveruppladdning utan uttryckligt användarval |

## 10. Informationsarkitektur och tekniska gränssnitt (vägledande, ej bindande)

Föreslagna logiska komponenter:

- **PPD-core:** parsning, migrering, schemavalidering, referensintegritet, dokumentoperationer.
- **Editor:** canvas, selection, undo/redo, objektverktyg, egenskapspaneler, temaredigering.
- **Runtime:** genererad presentation (eventuellt Reveal.js), navigation, animation, semantisk tillgänglighet.
- **HTML-packager:** inbäddning och deterministisk byggning av enfilspresentation.
- **PDF-export:** kontrollerad webbrendering, textbevarande och exportdiagnostik.
- **PPTX-export:** mappning till OOXML/native PowerPoint-element, fallback, fidelity-rapport.
- **Quality:** validerare, exportkompatibilitet, skärmbildsjämförelse, testfixturer.

**Teknikval är öppet.** React/TypeScript/Vite, ett canvas-bibliotek och Reveal.js är möjliga alternativ men ska inte läcka in i formatmodellen. Export kan vid behov ske genom en lokal CLI eller frivillig backend. Om PDF-export endast kan göras på servern ska detta vara synligt och HTML-visning/sparande fortfarande fungera lokalt.

### Föreslagna interna kontrakt

```ts
interface DocumentService {
  importPpdHtml(input: Blob): Promise<ImportResult>;
  validate(document: PpdDocument): ValidationReport;
  apply(command: EditCommand): PpdDocument;
  exportPpdHtml(document: PpdDocument): Promise<Blob>;
}
interface ExportService {
  exportPdf(document: PpdDocument, options: PdfOptions): Promise<ExportResult>;
  exportPptx(document: PpdDocument, options: PptxOptions): Promise<ExportResult>;
}
interface ExportResult {
  file: Blob;
  report: ExportReport;
}
```

Kontrakten ovan beskriver ansvar, inte slutgiltiga metodsignaturer.

## 11. Föreslagen implementation i etapper

| Etapp | Leverans | Utgångskriterium |
|---|---|---|
| 0. Formatkontrakt | JSON Schema, exempel, formatläsare, validerare | En godkänd exempel-PPD importeras och roundtrip-testas |
| 1. Kärneditor | Slides, text, former, bilder, lager, undo/redo | Användaren kan skapa, spara och återöppna en femsidig presentation |
| 2. Premiumvisualisering | Bakgrunder, transparens, gradienter, glas, teman | Referensslide liknar designmål i Safari och Chromium |
| 3. Presentation + HTML | Offline-HTML, navigering, basanimationer | Enfilspresentation fungerar på ren klient utan CDN |
| 4. PDF-export | PDF, sidstorlek, textbevarande, exportkontroller | PDF-matchning och läsbarhet godkänns |
| 5. PPTX-export | Native-objekt + effektraster + rapport | PPTX öppnas och text/former kan redigeras i Mac/Windows |
| 6. Fördjupning | Diagram, grupper, talaranteckningar, mallar | Separata acceptanstester enligt B-prioritet |

## 12. Acceptanskriterier – färdigt MVP

**AT-01 Import:** Ett giltigt PPD-dokument med 5 bilder och inbäddade resurser importeras offline. Bildordning, titel, objekt-ID och semantik är intakta.

**AT-02 Objekt:** Skapa text, bild, linje, pil, form och tabell. Flytta, rotera, ändra färg/opacitet och lager. Sparad förändring återkommer efter omladdning.

**AT-03 Premiumdesign:** Referensslide med fotobakgrund, mörk gradient, frostad glaspanel och text återges korrekt i både Safari och Chromium. Ingen överlappning/klippning vid 16:9.

**AT-04 Roundtrip:** HTML-export → ny import → samma semantiska innehåll, referenser och visuell ordning; inga förlorade nödvändiga resurser.

**AT-05 Offline:** Fristående HTML öppnas och spelas upp med helt avstängd nätverksanslutning.

**AT-06 PDF:** Exportera 5 bilder → 5 sidor med rätt proportioner; text är sökbar där möjligt, bildbeskärning korrekt, ingen extratom sida.

**AT-07 PPTX:** Exportera samma 5 bilder → presentationen öppnas i PowerPoint. Testaren ändrar rubrik, pil och formfärg på en bild och sparar; bakgrund och avsedda visuella effekter finns kvar.

**AT-08 Hybrid:** Glas/blur rasteriseras vid behov utan att huvudrubriker plattas till. Exportrapport namnger berörda objekt.

**AT-09 Fel:** Korrupt modell, saknade bildresurser och osäker inbäddad kod ger kontrollerade varningar/fel utan krasch eller dataförlust.

**AT-10 Versionsstöd:** Dokument med okänd obligatorisk funktion öppnas inte i full redigeringsläge utan explicit och tydlig kompatibilitetsinformation.

**AT-11 Flerbläddring:** Minst en end-to-end-testrunda i Safari och Chromium; faktisk PDF-/PPTX-granskning, inte bara filgenerering.

**AT-12 Tillgänglighet:** Presentationen kan navigeras med tangentbord, har synligt fokus, respekterar reduced motion och visar alt-texter för relevanta bilder.

### Definition of Done
MVP är **godkänd först när** samtliga M-krav och AT-01–AT-12 är verifierade i den riktiga implementationen, nödvändiga beroenden är licensmässigt klarlagda, formatet dokumenterats och ingen kritisk databortfallssituation är öppen.

## 13. Risker och beslutspunkter

| Fråga/risk | Föreslagen hållning |
|---|---|
| Canvas-redigering kontra DOM-baserad rendering | Prototypa båda; säkerställ gemensam PPD-modell och konsistent geometri |
| Fontskillnader mellan HTML/PDF/PPTX | Inbädda där licens tillåter; dokumentera substitution |
| Webbeffekter saknas i PPTX | Fallback som separat bildlager + transparent redigerbar text |
| PDF i Safari kontra Chromium | Lås renderingen för export i Chromium; testa Safari för visning |
| Endast en HTML-fil kan bli stor | Bildoptimering, återanvändning av tillgångar, kvalitetsinställning |
| Säkerhet i importerad HTML | Läs endast godkänd data, exekvera aldrig importerade skript i editor-kontext |
| Reveal.js-versionsberoende | Bädda motorversionen men håll PPD-kontraktet motoroberoende |
| Vad betyder ”spara”? | Nedladdad HTML är kanoniskt portabelt format; lokalt arbetsutkast skiljs från publicerad fil |
| Native diagramstöd | Fas B, förlustfri semantisk data kvar i PPD |

## 14. Underlag som bör ingå i utvecklingsstarten

1. Detta dokument: funktionell specifikation, krav och acceptanstester.
2. `presentationsformat_forslag_v0_2.md`: datakontraktet och objekt-/effektmodellen.
3. En maskinvaliderbar `ppd.schema.json` som konkretiserar v0.1 innan implementationen stabiliseras.
4. Ett kuraterat testpaket med standardobjekt, diagram, fotobakgrunder, långa texter, typsnitt, glas/blur och problemfall.
5. Två visuella referenser: en ren standard-slide och en premium-slide med glas/toning.

## 15. Beslut som behöver fastställas före utveckling

- Välj om browser-editor ska kräva en separat app eller om även exporterad HTML ska ha fullt redigeringsläge. Rekommendation: **separat editor; exporterad HTML innehåller hela modellen för återimport**.
- Välj exportmiljö för PDF/PPTX (klient, lokal companion/CLI eller frivillig server). Rekommendation: **klientlokalt där möjligt, tydligt och optional där server behövs**.
- Frys den första PPD-schema-versionen och välj hur migreringar/versioner ska hanteras.
- Bestäm mätbara toleranser för position, textbrytning och färg vid PDF/PPTX-export efter visuell pilot.
- Bestäm vilket stöd för native diagram i PPTX som måste finnas före första offentliga release. Förslaget ovan placerar det i nästa fas.

---

**Slutsats:** PPD Studio ska i första hand vara en **redigerbar och semantiskt hållbar presentationseditor**, inte bara en HTML-bildgenerator. Enfil-HTML är det kanoniska utbytesformatet; PDF är ett visnings-/distributionsformat och PPTX är ett interoperabilitetsformat med uttryckligen definierad redigerbarhet och exportavvikelser.


## 16. Kravkomplettering v0.2 – bindande prioritering och detaljer

**Normativ regel:** Detta kapitel ersätter motstridiga MVP-/B-/F-prioriteringar i avsnitt 1–15. Äldre krav-ID:n behålls som historiska referenser; nya PPD-S-ID:n är tillägg och spåras mot formatkraven PPD-F. **M = MVP (första användbara version), B = nästa etapp, F = framtida.** För ett förslag till utvecklingsstart ska alla M-krav kunna acceptanstestas.

### 16.1 Målfunktion och användarnivå

PPD Studio är ett **local-first** webbverktyg med ett självförsörjande PPD-HTML-dokument som primärt utbytesformat. Redigeringsgränssnittet ska vara begripligt för vana PowerPoint-/Keynote-användare: bildminiatyrer, arbetsyta, egenskapspanel, objekt-/lagerlista, teman och export. Visningsläget ska inte kräva editor, server eller konto. Viss kompatibilitet med PPD 0.1 är obligatorisk, men formatmigration får inte skriva över användarens original utan samtycke.

### 16.2 Master, tema, mallar och platshållare

- **PPD-S-201 (M):** Skapa, döp, duplicera, välja och justera presentationsmaster; minst titelbild, innehållsbild, två kolumner, bild + text, tom.
- **PPD-S-202 (M):** Redaktionella platshållare för titel, brödtext, bild, sidnummer och sidfot; innehåll kan bytas utan att objektets avsedda layout förstörs.
- **PPD-S-203 (M):** Ändring av master uppdaterar alla anslutna bilder och bevarar individuella innehållsbindningar och lokala överstyrningar.
- **PPD-S-204 (M):** Användaren kan återställa en slide till layouten eller bryta kopplingen; verktyget varnar om objekt blir obundna.
- **PPD-S-205 (B):** Hantering av externa återanvändbara temabibliotek och komponentbibliotek över flera dokument.

### 16.3 Rik text, klippbord och sök

- **PPD-S-210 (M):** Redigera text direkt på sliden och i egenskapspanel; blandad fet/kursiv/understruken/färg/storlek, hyperlinks och svenska tecken fungerar.
- **PPD-S-211 (M):** Styckeformat med punktlistor, flernivålistor, numrering, radavstånd, indrag, tabbar och horisontell/vertikal justering.
- **PPD-S-212 (M):** Explicit åtgärd för overflow: visa varning, öka textruta eller passa text enligt användarens val; ingen tyst minskning under temats lägsta typstorlek.
- **PPD-S-213 (M):** Klipp ut/kopiera/klistra in objekt och formaterad text inom och mellan öppna PPD-dokument, med stabila nya ID:n för kopior och bibehållna referenser.
- **PPD-S-214 (M):** Sök och ersätt i hela presentationen; möjlighet att välja matchningar och undvika att ändra dolda masterelement av misstag.

### 16.4 Exakta visuella redigeringsverktyg

- **PPD-S-220 (M):** Flerval och grupp/avgruppera; flytta, duplicera, rotera, proportionell skalning och ta bort med mus, touch och tangentbord.
- **PPD-S-221 (M):** Justera mot vänster/höger/mitten/topp/botten, fördela jämnt och snappa mot stödlinjer, rutnät och objektkanter; möjlighet att slå av snapping.
- **PPD-S-222 (M):** Layerpanel med z-ordning, visa/dölj, lås/lås upp, grupptillhörighet, tydlig aktuell markering.
- **PPD-S-223 (M):** Piltangentsjustering, numeriskt läge/storlek/rotation, förhållandelås och reset-transform.
- **PPD-S-224 (M):** Formateringspensel eller kopiera/klistra in stil mellan objekt av kompatibla typer.
- **PPD-S-225 (M):** Smarta linjer/ankare följer kopplade objekt när de flyttas, utan att skapa brutna referenser.
- **PPD-S-226 (M):** Användaren kan skapa återanvändbar komponent inom dokumentet med slots och lokala overrides.
- **PPD-S-227 (B):** Biblioteksuppdateringar av delade komponenter och mer avancerade layoutconstraints.

### 16.5 Bilder, tabeller, diagram och strukturobjekt

- **PPD-S-230 (M):** Ladda in bild, ersätt bild utan layoutändring, beskära, zooma inom mask, välja contain/cover och ange fokuspunkt.
- **PPD-S-231 (M):** Grundläggande bildjustering brightness/contrast/saturation och masker till vanliga geometriska former.
- **PPD-S-232 (M):** Skapa tabell; infoga/ta bort rader och kolumner, slå ihop celler, ändra ramar/fyllning/justering och celltext.
- **PPD-S-233 (M):** Skapa stapel-, linje- och cirkeldiagram från en datatabell som förblir redigerbar efter spara/öppna.
- **PPD-S-234 (M):** Diagramstilar (axlar, etiketter, legend, serier, färger) och tillgänglig datatabell.
- **PPD-S-235 (M):** Infoga ikon, pil och enkla processsteg som separata redigerbara objekt.
- **PPD-S-236 (B):** Tidslinjer, processkartor, organisationsscheman med semantiska relationer och alternativa layouter.
- **PPD-S-237 (B):** Avancerade diagramtyper/diagramkompositioner.
- **PPD-S-238 (M):** Öppen PNG-/JPG-export av enstaka bild eller alla bilder i valt pixelmått.
- **PPD-S-239 (M):** Exportval för bilder/diagram ska redovisa när objekt blir rasteriserade.

### 16.6 Bildordning, presentation och föredragshjälpmedel

- **PPD-S-240 (M):** Minatyrpanel stöder duplicera, dölja, flytta, ta bort, namn/sektion, flera markerade slides och drag-and-drop-ordning.
- **PPD-S-241 (M):** Presentatörsvy med aktuell/nästa bild, talaranteckningar, timer och möjlighet att snabbt hoppa till slide.
- **PPD-S-242 (M):** Fullskärm, tangentbord, touch, länkade steg, pausa och svart skärm; presentationsläget ska kunna användas offline.
- **PPD-S-243 (M):** Enkel övergång och stegvist uppbyggda objekt med kontrollerad statisk export till PDF/PPTX.
- **PPD-S-244 (B):** Pekverktyg/laser, ritanteckningar, tidsinställning och valbara interaktiva grenar.

### 16.7 Filhantering, trygghet och återställning

- **PPD-S-250 (M):** Öppna PPD-HTML offline via filväljare; validera modell, resurser, formatversion och skapa läsbar felrapport vid fel.
- **PPD-S-251 (M):** Spara som en ny självförsörjande HTML-fil som kan öppnas offline och återimporteras utan förlust av information för stödda fält.
- **PPD-S-252 (M):** Flera ångra/gör om-steg inklusive gruppoperationer, masterändring, text och diagramskiften; en konsekvent användaroperation = en undo-enhet.
- **PPD-S-253 (M):** Automatisk återställningspunkt under redigering (t.ex. IndexedDB), möjlighet att återuppta och explicit radera lokal återställningsdata; får inte vara beroende av konto.
- **PPD-S-254 (M):** Varning vid osparade ändringar och tydlig skillnad mellan arbetskopia och exporterad fil.
- **PPD-S-255 (M):** Export till PDF med korrekt sidformat, bevarad sökbar text där möjligt och möjlighet att välja slide-intervall.
- **PPD-S-256 (M):** PPTX-export med valen `editable-first`, `visual-first`, `flattened` och förhandsrapport över rasterisering/utelämningar. Faktiska Office-objekt ska användas för text, bilder, former och tabeller där möjligt.
- **PPD-S-257 (M):** Robust export även utan användarens nätuppkoppling; om headless-server krävs ska det framgå och offline-alternativ erbjudas med tydlig begränsning. Standardprofil ska kunna byggas med lokalt körd Chromium.
- **PPD-S-258 (M):** Exporterad PPTX öppnas utan reparationsdialog i PowerPoint; text/grundobjekt kan redigeras, inga betydande klippningar; exportrapport med objekttäckning.
- **PPD-S-259 (M):** En genomgående diagnostikpanel visar fel, varningar och begränsningar per slide/objekt och exportformat.
- **PPD-S-260 (B):** Importera grundläggande PPTX (text, former, bilder, slides, tabeller) med förlustrapport, inte bara platt bild.

### 16.8 Granskning, samarbete och AI

- **PPD-S-270 (B):** Kommentarer per slide/objekt, markerade trådar och enkel granskningsstatus; exportval för att ta med eller utelämna kommentarer.
- **PPD-S-271 (F):** Realtidssamredigering, behörigheter, delade bibliotek och molnsynk.
- **PPD-S-272 (F):** AI-assisterad utkastsgenerering, språkgranskning och designförslag; användaren ska godkänna materiella ändringar.
- **PPD-S-273 (F):** Videoexport, inspelad berättarröst, avancerad publikinteraktion.

## 17. Samlad prioritering och genomförbar utvecklingsordning

| Etapp | Innehåll | Exit-kriterium |
|---|---|---|
| **0 – Kontrakt** | JSON Schema 0.2, migration 0.1→0.2, fixtures, exportpolicy/diagnostik | Samtliga referensdokument validerar, ogiltiga referenser avvisas |
| **1 – Kärneditor** | Slides, arbetsyta, rik text, shapes, snapping, lager, undo, återställning | Standardmanipulationer fungerar utan dataförlust |
| **2 – Layout & objekt** | Master, platshållare, teman, bildbeskärning, tabeller, 3 diagramtyper | En ändring av master slår igenom konsekvent |
| **3 – Presentera & publicera** | Offline PPD-HTML, presentatörsvy, PDF/PPTX/PNG export och rapport | Hela round-trip-flödet med fixtures PASS |
| **4 – Interoperabilitet** | PPTX-import, semantiska diagram, kommentarer | Import-/exportförlust redovisas och kan granskas |
| **5 – Framtid** | Samarbete, inspelning, AI | Separata produktbeslut |

**MVP-gräns:** Etapp 0–3 inklusive M-kraven ovan. För att hålla komplexiteten rimlig kan delmål demoas separat, men en release får inte märkas **MVP komplett** förrän hela flödet stöds. Full PPTX-import och realtidssamredigering är inte blockerande.

## 18. Kompletterande acceptanstest (obligatoriska för MVP)

| Test-ID | Scenario | Godkänt när |
|---|---|---|
| AT-201 | Master och platshållare | Ändra gemensam logotyp/rubrikstil på master → minst tre slides uppdateras; lokala rubriktexter kvarstår |
| AT-202 | Layoutbyte | Byt titel→två kolumner→titel; inga bundna innehållsblock förloras och eventuella obundna objekt rapporteras |
| AT-203 | Formaterad text | Två stilar inom samma stycke, två listnivåer och länk överlever HTML-save/reopen och är redigerbara i PPTX när stödda |
| AT-204 | Geometri och grupper | Flytta grupperat objekt, lås ett barn, duplicera och ångra; inga dubbla ID:n eller ändrad z-ordning |
| AT-205 | Smart placering | Placera fem kort, distribuera jämnt och slå på/av snapping; geometri sparas och är stabil vid återöppning |
| AT-206 | Bildbehandling | Beskär foto till form, byt till ny bild; layout och fokus bevaras eller varning visas |
| AT-207 | Tabell | Slå ihop celler, flytta kolumn, ändra formatering; innehållet överlever HTML/PPTX/PDF |
| AT-208 | Diagram | Uppdatera tal i stapel/linje/cirkel; rendered slide, sparad JSON och export avspeglar samma data |
| AT-209 | Talaranteckningar | Två skärmar: publikvy visar inte anteckningar; presentatörsvy visar aktuell/nästa bild, timer och anteckningar |
| AT-210 | Undo och crash recovery | Ändra text+master+diagram, simulera omstart; lokal återställning fungerar och användaren väljer om den används |
| AT-211 | Offline PPD | Spara ensam HTML, koppla bort nätverk och öppna om; navigering, bilder, typsnitt och allt stödd data fungerar |
| AT-212 | PDF | 16:9 slides, svensk text och icke-standardtecken ger inga tomsidor/klippningar; text sökbar där möjligt |
| AT-213 | PPTX editable-first | Text, former, tabell är separata redigerbara objekt; avancerad blur rasteriseras och redovisas |
| AT-214 | PPTX visual-first | Visuell jämförelse mot HTML inom dokumenterad tolerans, redigerbar huvudtext och tydlig exportdiagnostik |
| AT-215 | Exportvarningar | Medvetet osupporterad effekt medför specificerad varning; ingen tyst utelämning |
| AT-216 | Migration och säkerhet | PPD 0.1 uppgraderas utan informationsförlust; injicerad HTML/JS i text exekveras inte |
| AT-217 | Klippbord, sök och flera slides | Objektkopiering ger nya ID:n, sök/ersätt uppdaterar avsedda träffar, slides kan dupliceras/sektioneras |
| AT-218 | PNG-export | Vald slide och hela presentationen exporteras i vald upplösning utan felaktig sidbeskärning |

**DoD för release:** Samtliga M-krav och AT-201–218 ska ha ett automatiserat test där det är praktiskt möjligt, annars dokumenterat manuellt prov; inga kritiska blockerare. PDF/PPTX ska verifieras i en riktig läsare, inte bara genom att filen genererats. Referensdokumenten ska omfatta minst en ljus, en mörk, en fotorealistisk och en diagramtung presentation.

## 19. Spårbarhet och produktbeslut

| Behov | Formatmodell | Verktygskrav | Beslut |
|---|---|---|---|
| Master/layout | PPD-F-201–205 | PPD-S-201–205 | MVP, inte senare etapp |
| Rich text | PPD-F-210–214 | PPD-S-210–214 | MVP |
| Geometri, ankare, gruppering | PPD-F-220–226 | PPD-S-220–227 | MVP med komponentbibliotek B |
| Bild, tabell, diagram | PPD-F-230–238 | PPD-S-230–239 | Enkla diagram i MVP |
| Presentation | PPD-F-240–245 | PPD-S-240–244 | Presenterarläge i MVP |
| Export/round trip | PPD-F-250–257 | PPD-S-250–260 | HTML/PDF/PPTX/PNG MVP, PPTX-import B |
| Revision, granskning | PPD-F-244, 16.8 | PPD-S-252–254, 270 | Undo/recovery MVP, kommentarer B |

### 19.1 Val som återstår innan implementation

1. Fastställ normativ JSON Schema 0.2 och interoperabilitetsprofiler (`reader`, `editor`, `exporter`).
2. Välj textlayoutmotor och metod att mäta exportfidelitet så att textrutor inte klipps.
3. Välj exporter: PPTX-generator som skapar native objekt + effektlager; PDF genom en reproducibel Chromium-miljö (gärna lokalt körbar).
4. Bestäm offlinegränser och maximal självförsörjande HTML-fil (inklusive stora bilder/video).
5. Fastställ minimikraven för tillgänglighet (t.ex. WCAG-relevant navigering, alt-text, läsordning).
6. Spika vilka element som får rasteriseras i `editable-first` och vilka fel som är blockerande.
7. Definiera testade målmiljöer (Chrome, Safari på macOS/iOS, Edge; PowerPoint på Mac/Windows; PDF-läsare).

### 19.2 Revisionshistorik

- v0.1: Basflöden, vanliga objekt, premiumeffekter, självförsörjande HTML, PDF/PPTX-export.
- **v0.2:** Uppdaterad MVP för arbetssätt hos PowerPoint/Keynote-användare, formatspårbarhet, tydligare import/exportkrav, acceptanskriterier och etapplan.
