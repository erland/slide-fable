# SF-ANIM-01 – Stabilisering av animationsmotorn

## Beslut och omfattning
Detta är första implementationen enligt animationsanalysen SF-ANIM-00. Målet är stabil och reproducerbar uppspelning av redan stödda effekter (**Visa**, **Tona in**, **Försvinn**) innan effektkatalogen utökas.

### Förändringar
- **Tidsmodell:** varje effekt får ett klicksteg, beräknad start och varaktighet. `with-previous` utgår från föregående effekts start; `after-previous` utgår från dess slut. Egna fördröjningar ackumuleras inte av misstag över flera `with-previous`.
- **Samma objekt flera gånger:** effekter på ett objekt inom samma klicksteg samlas till **en** WAAPI-tidslinje i stället för flera konkurrerande `fill:forwards`-animationer. Delvis överlappande effekter hanteras deterministiskt där senast startad effekt får företräde. Fördröjda entréer får explicita gränsnyckelrutor så att objektet inte blir synligt före start.
- **Navigering och omstart:** varje presentationsteg rekonstrueras från PPD. Bakåtsteg, hopp, reducerad rörelse och omstart tillämpar slutlig objektstatus utan att behålla tidigare webbläsaranimationer. Alla WAAPI-effekter avbryts och ursprungliga inline-stilar återställs vid stegbyte.
- **Paritet:** samma `animationSchedule`, `applyPlayback` och `playbackSteps` används av presentatörsläget och fristående HTML-spelare.
- Inga ändringar av PPD 0.4.0, tillagda effekttyper eller animations-OOXML i PowerPoint. PDF/PPTX förblir statiska vad gäller animationer.

### Verifieringskrav
1. `tests/playback.test.mjs`: relativa starttider och gränser, inga muterade data, en sammanhängande tidslinje per objekt, avbrytning, hopp, omstart, bakåt och reduced motion.
2. `tests/animation-stability-browser.mjs`: riktig Chromium WAAPI-uppspelning i desktop-, iPad-porträtt- och mobilviewport.
3. GitHub Actions kandidatgrind: TypeScript, lint, PPD, Node, Chromium, HTML/PDF/PPTX, PWA och befintliga regressionskontroller.

### Risker och avgränsning
Konflikter när *flera effekter på samma objekt börjar vid samma tid* har en definierad prioritet (senast i listan). Full PowerPoint-kompatibel timing av avancerade effekter, pause/resume, klicktriggers på enskilda objekt och animations-OOXML ingår inte. Ingen fysisk Safari-/Office-testning ingår i automatiserad verifiering. Detta är en motorförbättring, inte releaseacceptans.

**Nästa steg:** SF-ANIM-02 – vanliga entré-/avslutningseffekter och stegvis punktlisteanimation.
