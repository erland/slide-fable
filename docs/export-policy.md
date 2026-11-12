# Exportpolicy och kompatibilitet – mål och implementerat stöd

> **Kontrollerad mot kod 2026-11-12:** Export finns i `src/export/exportController.ts`,
> `src/export/html.tsx`, `src/export/pdfWriter.ts`,
> `src/export/pptxWriter.ts` och `src/export/plan.ts`.
> Tabellen nedan beskriver **eftersträvad representation per objekttyp**,
> inte en garanti att varje variant är implementerad eller fullt verifierad.
> Faktiska representationer kan bero på profil och objektets egenskaper.
> [Exporttäckningen](export-coverage.json) visar vilka automatiska belägg
> som finns och vilka manuella prov som saknas.

## Implementerad exportkedja

Appen kan skapa fristående HTML, PDF, PPTX samt ZIP med PNG/JPG. `saveStandaloneHtml`
hämtar en självständig HTML-fil. `exportPresentation` validerar en
dokumentkopia, väljer bilder via `src/export/slideSelection.ts`,
anropar vald exportmotor och hämtar dessutom en separat JSON-rapport.
HTML-exporten innehåller redigeringsmodellen; PDF/PPTX/bilder är
statiska i fråga om animationer och interaktioner.

För PDF/PPTX finns profilerna **editable-first**, **visual-first** och
**flattened**. I visual-first rasteriseras icke-textinnehåll där det stöds,
medan huvudtext kan behållas separat; flattened ger en platt bild per
presentationsbild. Enkla objekt kan skrivas som native även i en
editable-first-export, men unsupported effekter eller geometri kan
rasteriseras. Rapporten klassificerar objekt med
`native`, `hybrid`, `rasterized` eller `unsupported`
enligt `src/export/plan.ts`; en enskild rapportstatus är inte ett
Office-acceptansbevis.

PDF bygger på pdf-lib/fontkit med lokalt inbäddade typsnitt.
PPTX bygger på PptxGenJS och har extra metadata för vissa
redigeringskällor i `customXml`. Faktiskt öppna–redigera–spara i
PowerPoint på Mac/Windows och granskning i en oberoende PDF-läsare
återstår som manuella releasegrindar.

## Målinriktad kompatibilitetsmatris (inte full acceptans)

| Objekt | PPD-HTML | PDF | PPTX editable-first |
|---|---|---|---|
| Text/listor | Struktur och text | Sökbar text där stödd | Native text/runs |
| Former/linjer/pilar | DOM/SVG | Vektor där stödd | Native objekt |
| Bild/beskärning | Inbäddad resurs + parametrar | Bild med rätt crop | Bildobjekt med dokumenterad crop |
| Tabell | Strukturerade celler | Text/vektor | Native tabell; merge provas |
| Bar/line/pie | Dataset + SVG | Vektor/bild med rapport | Native när bevisat, annars raster med bevarad data i PPD |
| Semantiska diagram | Noder/kanter + SVG | Vektor | Former, kopplingar, text; avvikelse rapporteras |
| Formel | Källa + säker rendering | Vektor/bild | Ekvation om bevisat, annars SVG/bild; källa i metadata där praktiskt möjligt |
| Vektorbana | Sanerad SVG + källa | Vektor | Freeform/SVG där bevisat, annars bild |
| Glas/blur | Effekt + fallback | Renderat effektlager | Bakgrundsberoende rasterlager, huvudtext separat |
| Framtida typ | Säker fallback eller läsläge | Poster eller blockering | Poster eller blockering, alltid rapport |

## Normativ målbild och rapportkrav (inte allt implementerat)

Exportreport: format, profil, modellrevision/hash, motorversion, slideId,
elementId, status (native/hybrid/rasterized/omitted/unsupported), orsak och
bevarad/förlorad redigerbarhet. Okänd obligatorisk funktion blockerar export.
Utelämning får ske bara genom explicit användarval efter rapport, aldrig tyst.
visual-first behåller huvudtext där möjligt och redovisar kompromisser;
flattened är ett uttryckligt val som redovisar förlorad objektsredigering.
I PDF/PPTX väljs statisk slutvy för fragment som standard; dolda slides exporteras
endast enligt uttryckligt urval. Publikvy får inte inkludera anteckningar.

Pilot mäter textbrytning och klippning separat från bildjämförelse. Föreslagen
starttolerans för geometri är 1 logisk enhet i referenscanvas; den måste kalibreras.
Fotoberoende blur får inte rasteriseras isolerat utan korrekt bakgrundskomposition.
Webbfonter innebär inte att mottagarens PowerPoint har samma font; rapportera substitution.

## Nuvarande rapportfält och avgränsningar

`ExportReport` i `src/export/plan.ts` har fälten `format`, `profile`,
`sourceHash`, `objects` och `warnings`. Varje objektpost har
`slideId`, `elementId`, `status` och `reason`.
Följaktligen är kraven ovan på bland annat separat motorversion,
modellrevision och explicit klassning av förlorad redigerbarhet **inte
alla egna strukturerade rapportfält i nuvarande implementation**.
Rapporten ger avvikelser och varningar, men kan inte ersätta jämförelse
i mottagarprogrammet.

SF-QUAL-07–10 skapar dessutom referensbilder, en diagnostisk
redigerare/PDF-jämförelse och skillnadsbilder. Den här kontrollen gör
**ingen automatisk Office-acceptans**. Se
[DOC-AUDIT-02](doc-audit-02-architecture-ppd-export.md) för verifierade
skillnader mellan måltext och kod.

