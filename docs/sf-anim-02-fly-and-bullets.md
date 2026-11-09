# SF-ANIM-02 – riktningsanimationer och stegvis punktlista

## Funktion
Animationer har nu två nya effekter, **Flyg in** och **Flyg ut**, med fyra riktningar (vänster, höger, upp, ned). Varje effekt använder redan tillgängliga PPD 0.4-fält: `effect`, `phase`, `from.offset` respektive `to`. Vektorn har värden -1, 0 eller 1 och översätts i uppspelningen till ett avstånd motsvarande 110 % av objektets dimension, utan att skriva över objektets befintliga rotation.

**Punktlista stegvis** är tillgänglig för ett markerat text- eller formobjekt med minst två liststycken. Kommandot skapar en entréanimation per stycke, med en klickgrupp per punkt. Enskilda stycken adresseras genom `from.paragraph.x`, som innehåller styckets nollbaserade index i textobjektets rika text. Icke-listade stycken berörs inte, och ingen särskild animeringsmodell eller PPD-version krävs.

## Redigering
- Ribbon → Animeringar: Flyg in, Flyg ut, Punkter stegvis.
- Egenskapspanel → Effekter: samma effekter, plus valbar riktning för flyg-effekter samt befintlig ordning, trigger, fördröjning, varaktighet och borttagning.
- Animationerna sparas i dokumentet med validering och ångra/gör om.
- Presentatörsläget och fristående HTML kör **samma** `animationSchedule` och `applyPlayback`, med återställning vid bakåtnavigering, omstart och reduced motion.

## Test och acceptans
- `tests/playback.test.mjs`: PPD, effektriktning, ogiltiga vektorer, undo/redo, punktlistemodell och stegvis uppspelning.
- `tests/motion-ribbon-browser.mjs`: interaktion med ribbon, riktning och tre punktsteg i desktop/iPad-porträtt/mobil.
- `tests/animation-stability-browser.mjs`: riktig Chromium WAAPI med CSS translate, bibehållen rotation och liststycken per klick.
- CI-kandidatgrinden: TypeScript/lint, PPD-schema, övriga UI-, export-, PDF/PPTX-, PWA- och HTML-regressioner.

## Avgränsningar
Blandade markerade objekt, animering per ord eller tecken, avancerade rörelsebanor och flera riktningseffekter på samma objekt med överlappande starttider är inte en del av detta steg. Punktindex kan behöva revideras om användaren redigerar listans struktur *efter* att animationerna skapats. PDF/PPTX och bildexport är fortsatt statiska; native PPTX-animationer planeras separat efter förstudie.
