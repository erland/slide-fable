# SF-NEXT-02 – arbetsflödesbaserad UX-granskning

**Datum:** 2026-11-08  
**Källa:** bifogad SF-NEXT-01-källkopia, `src/ui/EditorApp.tsx`, `src/ui/editor.css`, komponenter och browser-tester under `tests/`.  
**Metod:** statisk genomgång av faktiska UI-vägar och existerande testfall. **Ingen ny körning i webbläsare eller test på fysisk iPad** gjordes i denna miljö (inga installerade npm-beroenden). Fynd markeras därför *kodbelagd risk* respektive *implementerad begränsning*, inte som observerat fel i körande app.

## Arbetsflödestäckning

| Flöde | Befintligt stöd/testevidens | Kvar att testa praktiskt |
|---|---|---|
| Skapa, byta, kopiera, sortera och ta bort bilder | `SlideFilmstrip`, `SlideOverview`; `tests/common-workflows-browser.mjs` | Effektivitet, pekskärm, tangentbordsordning |
| Infoga och formatera text/form/bild | Ribbon och egenskapspanel; `tests/inline-text-browser.mjs`, `tests/insert-gallery-browser.mjs` | Friktion mellan kontextflik och egenskapspanel |
| Tabeller, diagram, formler och andra objekt | `TableEditor`, `ChartEditor`, JSON-fält i `EditorApp.tsx` | Ändra vanliga egenskaper utan JSON |
| Ångra/gör om, spara/öppna, återställ | Kommandon och persistens; `tests/common-workflows-browser.mjs`, `tests/document-file-browser.mjs` | Användarens mentala modell av Spara / autospara |
| Presentera och animationer | `RibbonMotion`, `AnimationPanel`; common-workflows | Dolda egenskaper, presenter-läge på iPad |
| Export PDF/PPTX/HTML/bilder | `src/export`; specialiserade tester | Faktisk filtrohet i PowerPoint och PDF-läsare |

## Prioriterade fynd

### UX-02-01 (P1) – Animationskommandot öppnar inte konsekvent dold egenskapspanel
- **Typ:** kodbelagd risk, konkret tillståndskonflikt.
- **Berör:** `src/ui/EditorApp.tsx` (kommandot `animations`, `showProperties`, mobilt panelval); `src/ui/editor.css` (panel visas enbart om `data-properties-open=true`).
- **Steg:** 1. Dölj egenskapspanelen. 2. Öppna Visa. 3. Aktivera ”Övergångar och animeringar”.
- **Kodens beteende:** kommandot kör `setTab('animations');setPanel('properties')` men inte `setShowProperties(true)`; CSS döljer fortsatt `.properties` när `data-properties-open=false`. Ingen runtime-reproduktion gjord.
- **Förväntat:** animationspanelen blir synlig oavsett tidigare dolt läge, även i smal och stående vy.
- **Åtgärd SF-NEXT-03:** centralisera `openProperties(tab)` och säkerställ `showProperties=true` vid varje kommando som kräver panelen.
- **Acceptans:** browser-test som stänger panelen, aktiverar animationer och verifierar panelens synlighet och fokus på desktop 1440×900, tablet portrait 768×1024 samt mobil 390×844.

### UX-02-02 (P1) – Spara har en annan betydelse än i traditionella desktopappar
- **Typ:** verifierad produktmodell, UX-risk (inte tekniskt fel).
- **Berör:** `EditorApp.tsx`, Arkiv-menyn och hjälptext.
- **Steg:** 1. Öppna en lokal HTML-presentation. 2. Redigera. 3. Välj Arkiv → Spara. 4. Fortsätt redigera och välj Spara igen.
- **Kodens beteende:** Spara laddar ned en ny redigerbar HTML-fil; en separat lokal arbetskopia autosparas. Arkiv har förklarande text, men beteendet skiljer sig från att skriva tillbaka till samma fil i PowerPoint.
- **Förväntat:** användaren ser alltid om arbetet är lokalt autosparat och förstår att en nedladdning är en separat fil, utan risk att tro att originalfilen skrivits över.
- **Åtgärd:** UX-språk och statusindikator testas med användare innan eventuellt ändrad knapptext eller File System Access-integration. Behåll export-/lagringskontraktet.
- **Acceptans:** tydlig konsekvent förklaring i Arkiv, status och hjälp; kontrollerad testning av ”Öppna → redigera → Spara → öppna igen”.

### UX-02-03 (P2) – Avancerad objektredigering kräver fortfarande JSON
- **Typ:** implementerad begränsning.
- **Berör:** `EditorApp.tsx` `JsonField`, tabellceller, diagramdata, vektorkälla, interaktioner, effekter, master och layout.
- **Steg:** Infoga tabell eller diagram; försök ändra sammanslagna celler, avancerad datastruktur eller effekt via egenskaperna.
- **Kodens beteende:** vissa kontroller finns, men avancerade fält exponeras fortfarande som redigerbar JSON. Hjälpen säger också att avancerade diagram, master och effekter redigeras som validerad JSON.
- **Förväntat:** vanliga uppgifter görs med formulär, menyer eller direkta objektkommandon; rådata är ett expertläge.
- **Åtgärd:** kartlägg topp-5-uppgifter per objekttyp; ersätt stegvis de vanligaste JSON-vägarna. Ändra inte PPD-kontrakt utan separat beslut.
- **Acceptans:** användaren kan uppnå valda normalfall utan att skriva JSON; validering och undo fungerar.

### UX-02-04 (P2) – Panelnavigation i stående/smal vy måste testas som sammanhängande kedja
- **Typ:** särskild testlucka; inget fel påstås.
- **Berör:** `mobile-panels`, `setPanel`, `setShowProperties`, CSS-brytpunkter 900/1200px och portrait.
- **Steg:** välj bild → markera objekt → öppna Format/Egenskaper → ändra objekt → tillbaka till canvas → välj annan bild. Upprepa med tangentbord/VoiceOver på iPad portrait och mobil.
- **Förväntat:** inget kommando lämnar verktyg i dold panel; markerat objekt förblir tydligt; det går att återvända utan att tappa kontext.
- **Åtgärd:** utöka browser-sviten med ett enda end-to-end-flöde över panelbyten och dokumentera Safari-kontroll separat.
- **Acceptans:** Chromium desktop/tablet/phone utan osynliga paneler, oavsiktlig scroll eller förlorad markering; separat manuell Safari/iPad-signerad kontroll före release.

### UX-02-05 (P2) – Dubbla vägar till grundkommandon bör utvärderas, inte tas bort godtyckligt
- **Typ:** informationsarkitektur/risk, ingen bekräftad defekt.
- **Berör:** toppfält, Arkiv-menyn, Start-ribbon och kontextmeny i `EditorApp.tsx`.
- **Kodens beteende:** Ångra/gör om och andra vanliga åtgärder finns på fler platser. För vissa funktioner är detta normalt i PowerPoint; för många kan konkurrerande paneler öka belastningen.
- **Åtgärd:** gör en kommandokarta med primär placering, alternativvägar och konsekventa namn; minimera endast faktisk redundans som hindrar arbetsflöden.
- **Acceptans:** samtliga kommandon som behålls har konsekvent aktiveringslogik, etiketter och genvägar.

## Vad granskningen **inte** styrker

- Ingen visuell browsergranskning har utförts på körande bygge; inga skärmbilder eller mätresultat skapas i detta steg.
- Ingen jämförelse av faktisk PPTX i PowerPoint för Mac/Windows har gjorts.
- Ingen Safari/WebKit eller fysisk iPad-acceptans har gjorts.
- Ingen ändring av applikationskod eller befintlig funktionalitet har gjorts.

## Rekommenderad avgränsning för SF-NEXT-03

**Välj en enda konkret fix först: UX-02-01.** Gör egenskapspanelens öppning konsekvent för animationskommandot och eventuella liknande ingångar, lägg till smal-vy-regression och kör lint, build samt berörda browser-tester. Övriga fynd förblir produktbacklog tills de validerats praktiskt. Ursprungsplanens DEV-004–015 och releasegrindar förblir oförändrade.
