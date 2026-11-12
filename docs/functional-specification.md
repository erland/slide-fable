# Funktionell specifikation – Slide Fable (krav och implementerad profil)

> **Läsanvisning 2026-11-12:** Kravlistan och SF-COMMON-beskrivningarna nedan är normativ målbild och historiska utvecklingsbeslut, inte automatiskt acceptansbevis. Den daterade implementeringsmatrisen från 2026-11-08 är en historisk ögonblicksbild. Se den nya källavstämningen sist i dokumentet, [responsiv UX](responsive-ux.md) och [releasegranskningen](release-review.md).

## Omfattning och normativ bas
Originalspecifikationen i `reference/ppd_presentationsverktyg_funktionell_specifikation_v0_3.md`
införlivas genom referens med prioriteringen i produktgrunden. Alla ursprungliga
krav behåller sina ID:n och prioriteter. Ingen funktion stryks för att tidigare
text kallar den B när senare normativ text säger M. Spårning finns maskinläsbart.

Full MVP omfattar bland annat master/platshållare, rik text/listor, grupper,
komponenter inom dokumentet, lager, snapping, bildbeskärning, redigerbara tabeller,
bar/line/pie, process/hierarki/tidslinje, ekvationer, vektorbanor, anteckningar,
presentatörsvy, ångra, återställning, HTML/PDF/PPTX/PNG/JPG och diagnostik.
Nästa nivå: frihand, actions, avancerad text, media, galleri, kodblock och fler
diagram. Senare: 3D, kartor, bifogade dokument, samarbete och AI. En importerad
frivillig typ utanför editorns profil ska ändå hanteras säkert med fallback eller
tydligt begränsat läsläge; dess ursprungspayload ska inte försvinna.

## PWA- och enhetskrav
| ID | Krav | Verifierbart acceptanskriterium |
|---|---|---|
| SF-001 | Responsiv editor | 390×844, 768×1024, 1024×768 och 1440×900 CSS-px; inga oåtkomliga kommandon eller horisontellt sidscrollande paneler |
| SF-002 | Likvärdig grundredigering | Skapa, öppna, ändra text, flytta via drag eller numerik, ordna slides, ångra, spara och presentera på samtliga målenheter |
| SF-003 | Installation | Manifest, ikoner, HTTPS och fungerande fristående start; installationshjälp anpassad till observerat webbläsarstöd |
| SF-004 | Offline-app | Efter slutförd första cachelagring startar appen offline, öppnar lokalt dokument och kan redigera och spara HTML |
| SF-005 | Återställning | Transaktionell arbetskopia och revisionskontroll; avbruten lagring förstör inte senast bekräftade kopia; tydlig kvot-/lagringsvarning |
| SF-006 | Pekning och tangentbord | Touch/mus/pennpekare via gemensamma operationer, synligt fokus, ingen obligatorisk hover; primära touchmål minst 44×44 CSS-px |
| SF-007 | Säker appuppdatering | Ny service worker aktiveras vid säkert byte; osparad redigering eller pågående export avbryts inte av automatisk omladdning |
| SF-008 | Portabla filer | File input och Blob-nedladdning är bas; direktskrivning/delning är bara kapacitetsstyrda tillägg |
| SF-009 | Lokal integritet | Inga dokument/resurser lämnar enheten utan explicit export-/uppladdningsval; ingen obligatorisk telemetri |
| SF-010 | Begripliga sparstatusar | Skilj Ändringar i minnet, Arbetskopia sparad lokalt och Fil exporterad; misslyckande får inte visas som sparat |
| SF-011 | Säker samtidighet | Två flikar får inte tyst skriva över varandras revisioner; andra fliken blir läsläge eller skapar en uttrycklig kopia |
| SF-012 | Publikexport | Val om anteckningar/proveniens; varna att återimporterbar HTML innehåller underliggande modell, även innehåll som inte visas |

## Användarflöden
Start → Ny från mall/Öppna fil/Återuppta → Redigera → Förhandskontroll →
Presentera eller Exportera. Export visar format, profil, urval och objektrapport.
Import valideras i isolerad temporär modell; aktuell arbetskopia byts först när
importen kan accepteras. Misslyckad export behåller dokumentet och erbjuder försök igen.
En borttagen resurs används inte av andra objekt förrän referensräkning kontrollerats.

## Icke-funktionella mål
Föreslagna pilotbudgetar, ännu inte uppmätta: 20 slides/200 objekt, 25 MiB total
inbäddad resursdata; vanlig navigation p95 <100 ms och inputrespons p95 <100 ms
på en namngiven referens-iPad och laptop. Mät även telefon separat. Mål för
importfil 50 MiB och enskild bild 10 MiB är konfigurerbara skydd, inte formatgränser.
Bilddimensioner, objektantal, formeldjup och SVG-komplexitet begränsas också.
Tunga operationer ska kunna avbrytas utan modellförlust.

## Utanför första leverans
Ingen inloggning, serverdatabas, realtidssamarbete, AI-tjänst, PPTX-import,
appbutikspublicering eller abonnemang. Ingen automatisk synk mellan enheter;
användaren flyttar sin HTML-fil. Inga sådana framtidskrav hindrar första delmålet.

## Vanliga presentationsflöden – tillägg 2026-11-05

SF-COMMON-01: Flerobjektsmarkering erbjuder gemensam fyllning, ramfärg,
ramtjocklek, textfärg och textstorlek. Blandade värden visas uttryckligen.
Endast olåsta objekt som stöder egenskapen ändras; grupper genomsöks inte.
Textformat gäller hela objektets text, inklusive explicita run-värden.
En åtgärd är en atomisk transaktion som kan ångras och göras om.

Godkänt fortsatt arbete: förbättrade textverktyg och visuell bildbeskärning,
därefter visuella teman/layouter, inklistring/tabeller/diagram, bildöversikt,
animering/media och en separat avgränsad PPTX-importetapp.

SF-COMMON-02: Textredigeraren erbjuder typsnitt för markerad text och
radavstånd, avstånd före/efter samt indrag för berörda stycken. Befintlig
run-formatering och listsemantik ska bevaras.
Bilder beskärs via lokal visuell förhandsvisning med zoom, mus/fingerdrag och
tangentbord. Avbryt lämnar dokumentet oförändrat; tillämpning är en ångringsbar
transaktion. Utsnitt ligger alltid inom bildresursen och sparas i befintlig crop-modell.
Typsnittsval laddar inte ned externa typsnitt; tillgänglighet och Office-/PDF-ersättning
följer fortsatt exportens dokumenterade begränsningar.

SF-COMMON-03: Layout- och temagalleri visar visuella förhandsvisningar.
Layoutbyte bevarar befintligt innehåll, kopplar platshållare efter roll och lägger
till saknade textplatshållare. Omatchade objekt behåller synlig geometri och stil.
Teman kan väljas och anpassas med färger och rubrik-/brödtexttypsnitt; lokala
objektformat bevaras. Varje ändring kan ångras. En designmall är ett nytt PPD-dokument
med masters, nödvändiga resurser och exempelplatshållare, utan källans bilder och
anteckningar. Exporten ändrar inte aktuell presentation.

SF-COMMON-05: Bildöversikten visar alla bilder med flerval, intervallmarkering,
gemensam duplicering, borttagning, dölj/visa och layoutbyte. Bildordning ändras via
dragning eller tillgängliga flyttknappar. Varje gemensam åtgärd är ångringsbar.
Återanvändning från validerad HTML/JSON förhandsvisas separat; aktuell presentation
ersätts inte. Valda bilder infogas efter aktiv bild. ID:n och resursreferenser
isoleras, valda interna bildlänkar mappas och länkar till ej införda mål tas bort
med återkoppling. Utseende, innehåll och anteckningar bevaras; importerade bilder
frikopplas från källans masters/layouter. Hela kandidaten valideras och en ändrad
målrevision avbryter införandet. PPTX-import ingår inte. Nya 0.4-bilder kan inte
infogas i en äldre 0.3-presentation; komponenter med bildberoende contentRef avvisas
uttryckligen tills deras kontextberoende kan bevaras fullständigt.


SF-COMMON-06 (första version): Bildens leveranspanel erbjuder Ingen/Toning och
varaktighet för bildövergång. Objekt i PPD 0.4 kan få Visa, Tona in och Försvinn,
med ordnad lista, Vid klick/Med föregående/Efter föregående, varaktighet och
fördröjning (0–60 000 ms). Med föregående räknas från föregående start,
Efter föregående från föregående slut. Första automatiska effekten spelas vid
bildstart. Varje klickgrupp och befintliga fragment använder gemensamma steg.
Bakåt rekonstruerar föregående steg utan rörelse; ny bild återställer uppspelningen.
Presentation i app och fristående HTML använder samma planering och DOM-spelare.
Minskad rörelse tillämpar slutläget direkt men behåller klickstegen. Uppspelning
ändrar inte dokumentet; redigeringsåtgärder är ångringsbara. Borttagna mål städas.
Importerade andra effekter bevaras men spelas inte. PDF/PPTX/bildexport är statiska
med samtliga synliga objekt och exportvarning. Ingen avancerad tidslinje,
ljud-/videohantering eller nya schemafält ingår i denna första version.

## Historisk implementerad funktionsprofil – avstämning 2026-11-08

Den ursprungliga specifikationen ovan är **normerande målbild**; den får inte
likställas med att alla krav har full acceptans. Följande delmängd kan beläggas
direkt i redigerarens kod och automatiserade tester på `main` efter PR #119:

| Område | Implementerad användarfunktion | Begränsning och evidens |
| --- | --- | --- |
| Tabeller | Celltext, rubrikcell, rader/kolumner, horisontell sammanfogning och **Dela cell**, kolumnbredder, marginaler, kantlinjer | Delning gäller endast giltigt horisontellt spann utan vertikala spann och inkonsekvent rutnät. `src/editor/ObjectEditors.tsx`, `src/editor/tableCells.ts`, `tests/table-split-browser.mjs` |
| Diagram | Stapel/linje/cirkel; namn, kategorier, numeriska värden; skapa, ta bort och flytta serier/kategorier utan JSON | Minst en serie/kategori. Kategoriflytt och borttagning synkroniserar värden. `src/editor/ObjectEditors.tsx`, `tests/data-ribbon-browser.mjs` |
| Responsiva paneler | Växla mellan bilder, arbetsyta och egenskaper; markering och paneltillstånd hålls samman; bildersättning | Automatiserade Chromium-prov på skärmstorlekar, inte fysisk Safari-acceptans. `src/ui/EditorApp.tsx`, `tests/panel-workflow-browser.mjs` |
| Bildredigering | Infoga, ersätt, beskär visuellt och ändra bildinställningar | Full export- och hårdvaruparitet ej slutaccepterad. `src/ui/EditorApp.tsx`, `src/editor/ImageCropEditor.tsx` |
| Presentation | Enkel toningsövergång och objektanimeringar på PPD 0.4; offline HTML-spelare | Ingen avancerad animationstidslinje eller Office-animeringsexport. `src/ui/AnimationPanel.tsx`, `src/core/playback.ts` |
| Export | Fristående HTML, PDF, PPTX och rasterformat med exportprofiler och varningar | OOXML-/PDF-regressionstester finns, men faktisk Office Mac/Windows och oberoende PDF-läsare återstår som acceptanskrav. `src/export/`, `docs/release-review.md` |

**Versionsgräns:** Nya presentationer använder PPD 0.4.0, men formatets
schema- och modellstöd innebär inte att varje egenskap har komplett
redigering, rendering och export. Se `docs/ppd-contract.md`.

**Releasegräns:** Automatiskt verifierad delmängd betyder inte att hela
MVP:n är färdig. `NOT_READY` kvarstår tills öppna releasegrindar fått
egna belägg. När en funktion eller ett acceptanskrav ändras bör både
matrisen och `docs/user-guide.md` uppdateras.

## Källbaserad komplettering – 2026-11-12

Denna komplettering jämför aktuella användarflöden med koden och regressionstesterna efter PR #152–155 och senare dokumentationsuppdateringar. **Implementerat** avser en användarväg i nuvarande kod; **automatiskt verifierat** avser den begränsade omfattningen i nämnda test. Full fysisk/enhets- eller Office-acceptans är fortfarande separat.

| Område | Status i aktuell implementation | Spårbar evidens och återstående gräns |
| --- | --- | --- |
| Layoutbyte | Implementerat: layoutstyrda textobjekt får en bevarad roll/slot och återanvänds vid återgång mellan layouter. Ett nytt objekt skapas första gången en saknad platshållare behövs. Vanliga fristående objekt tas inte över. | `src/core/designGallery.ts`, `tests/design-gallery.test.mjs`. Äldre redan duplicerade objekt rensas inte automatiskt. Visuell acceptans på Safari återstår. |
| Lokala arbetskopior | Implementerat: automatiska IndexedDB-arbetskopior återställs från **Arkiv → Arbetskopior…** efter bekräftelse. Ångra är separat redigeringshistorik och återtar inte en dokumentåterställning. | `src/core/persistence.ts`, `src/ui/EditorApp.tsx`, `tests/lifecycle-browser.mjs`, `tests/editor-browser.mjs`. Verkliga lagringsutkastningar på iOS återstår. |
| Responsiv panelnavigation | Implementerat: **Bilder / Arbetsyta / Egenskaper** i mindre vyer; egenskapskommandon återöppnar dold panel och behåller markering i testade flöden. | `src/ui/EditorApp.tsx`, `src/ui/editor.css`, `tests/panel-workflow-browser.mjs`, `tests/motion-ribbon-browser.mjs`. Automatiserad Chromium-desktop/iPadstorlek/mobilstorlek, inte fysisk Safari/VoiceOver. |
| Presentation | Implementerat: presentationsläge, separat publikvy, anteckningar, tidsräkning, svart skärm och proportionell skalning av bildytan; enkla animeringar. | `src/ui/PresentationSlide.tsx`, `src/core/playback.ts`, `tests/motion-ribbon-browser.mjs`, `tests/editor-browser.mjs`. Tvåskärmsacceptans och fysisk Safari saknas. |
| HTML, PDF, PPTX, PNG/JPG | Implementerat: nedladdningsbara filer och separata export-/förlustrapporter inom dokumenterad objektprofil. | `src/export/exportController.ts`, `docs/export-coverage.json`. Diagnostisk redigerare/PDF-bildjämförelse finns; PowerPoint Mac/Windows och oberoende PDF-läsare är ännu inte manuellt godkända. |
| Vanlig dokumenthantering | Implementerat: **Spara** hämtar HTML-fil och separata arbetskopior autosparas lokalt. Detta är inte samma sak som att skriva tillbaka till den tidigare öppnade filen. | `src/ui/EditorApp.tsx`, `tests/document-file-browser.mjs`; viktigt att behålla i UI-texter och användarguide. |

Den tidigare texten under **PWA- och enhetskrav** är fortsatt krav, inte ett påstående att alla SF-001–012 är fullt godkända. Detsamma gäller samtliga AT-kriterier. Nya deltester stänger inte automatiskt releasegrindarna RG-005–010, och `NOT_READY` kvarstår.

