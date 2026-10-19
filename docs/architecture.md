# Målarkitektur

## Beslut och status
Föreslagen struktur: en statiskt hostad React/TypeScript/Vite-app med domänkärna
utan React-beroende. DOM/SVG är förstahandsval för gemensam rendering och sökbar
text. Canvas används bara när det behövs för rasterexport/effektlager; DOM/SVG-
valet prövas i DEV-002 innan editor byggs brett. Ingen obligatorisk backend.
DEV-002:s versionslåsning, evidens och återstående begränsningar finns i
`docs/dev002-technical-decisions.md` och spikens package-lock.json.

| Modul | Ansvar | Får inte äga |
|---|---|---|
| ppd-core | Schematyper, semantisk validering, migration, kommandon, stabila ID:n | DOM, nätverk, editorpaneler |
| renderer | Modell → DOM/SVG, textmätning, effektfallback, print | Egen alternativ dokumentmodell |
| editor | Urval, handtag, interaktion, responsive paneler, undo-transaktioner | Direkt DOM-redigering som enda sanningskälla |
| persistence | IndexedDB, resurser, revisionskonflikter, återställning | Molnsynk eller garanti om evig lagring |
| player | Navigering, fragment, publikvy, presentatörsvy | Att läcka anteckningar till publikfönstret |
| exporters | Enfil-HTML, PDF, PPTX, bildfiler och gemensam rapport | Tyst ändring av semantisk modell |
| app-shell | Routing, manifest, cache, installation, säker uppdatering | Att lägga användardokument i appens cachepolicy |

## Data och transaktioner
Fil → extrahera endast kanonisk JSON/resursdata utan att köra importerad HTML →
schema/semantik/resurskontroll → säker intern dokumentmodell → kommando → ny
modellrevision → gemensam renderer och transaktionell arbetskopia. DOM genereras
från modellen. Under rik-textinmatning får en lokal editorbuffert finnas; den
översätts till kanoniska runs som en sammanhängande undo-transaktion.
Editorhistorik, zoom, paneler och markering lagras separat från publikformatet.
Binary Blobs lagras separat internt men materialiseras enligt filkontrakt vid export.
En flik/revision är skrivägare; compare-and-swap eller låsning förhindrar tyst konflikt.

## Två offlineprodukter
PWA-appen hämtas först över HTTPS och cachar appskal, egna fonter och kod för
offline-start. Appuppdatering är versionsstyrd och väntar på säker kontrollpunkt.
Den exporterade HTML-filen bäddar däremot in modell, runtime, stilar och resurser;
den ska inte kräva service worker, konto, server, CDN eller modulhämtning från file://.
Testa varje väg separat, inklusive återstart av installerad app och kall filöppning.

## Lagring och återställning
IndexedDB med versionshanterade migreringar och atomiska snapshots. Be om beständig
lagring där det går, men anta aldrig att den beviljas. Fånga kvotfel och erbjud
filbackup. Visa avbrott och radera lokal data på användarens begäran. Ny databasversion
ska inte göra återställning omöjlig när en äldre flik fortfarande är öppen.

## Export och motorval
- HTML: liten egen presentationsruntime som återanvänder renderer; Reveal.js behövs
  inte i grunden. Välj först efter pilot av navigering/fragment och filstorlek.
- PPTX: PptxGenJS är kandidat för klientlokala texter, former, bilder och tabeller.
  Faktiskt stöd för grupp/diagram/effektlager bevisas med fixtures, OOXML-inspektion
  och Office-prov. Ingen löftesparitet utifrån bibliotekets API-lista.
- PDF: DEV-002 väljer klientlokal pdf-lib/fontkit med browsermätta textrader för
  fortsatt utveckling. Browserutskrift och lokal Chromium-CLI är alternativ.
  Sökbar export är bevisad i Chromium; faktisk iPad och full objektkatalog återstår.
- Ekvationer: KaTeX kandidat för säker LaTeX; begränsa trust, expansion och storlek.
  MathML kräver separat allowlist/säker normalisering; LaTeX-stöd innebär inte MathML-input.
- SVG: allowlist-baserad sanering, ingen script, foreignObject, eventhandlers eller
  externa resurser. Automatisk testning av XSS och komplexitetsgränser.

## Driftsättning
Statisk HTTPS-hosting med rätt basväg och cache headers. Ingen databas behövs.
Node används vid build; lokal PDF-CLI är separat valfri komponent. Coolify/static
container kan läggas till senare; ingen publik driftsättning utförs i planeringssteget.
Inga obligatoriska externa API:er. Diagnostik stannar lokalt med exportbar rapport.
