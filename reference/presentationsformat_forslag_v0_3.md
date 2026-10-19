# PPD v0.3 – formatspecifikation och utökad objektkatalog

**Status:** förslag, ej fastställd standard. **Bas:** PPD v0.2. **Kontrakt:** `ppd.schema.json` (Draft 2020-12). **Datum:** 2026-10-19.

## 0. Normativa tillägg v0.3 (gäller före äldre v0.2-text nedan)

PPD v0.3 behåller kanonisk semantik, design, delivery och resurser. Schemat kräver `schemaVersion: "0.3.0"`. Formatet utvidgar objekttyper utan att blanda ihop grafiska *komponenter*, *objekt* och *interaktioner*. Tidigare `process`, `timeline` och `orgChart` finns kvar som äldre kompositionsformer; nya semantiska diagram bör nyttja `semanticDiagram`. Äldre v0.2 kan migreras med explicita konverteringsregler, inte bara byte av versionssträng.

### 0.1 Objektkontrakt och stöd

| Typ | Obligatorisk payload | Innehåll/redigering | HTML | PDF | PPTX | Fas |
|---|---|---|---|---|---|---|
| `semanticDiagram` | `kind`, `nodes` | Redigera noder, kanter, layoutvariant | SVG/HTML och tillgänglig text | Vektor om möjligt | Native former/kopplingar, annars grupperad hybrid | MVP: process/hierarki/tidslinje |
| `equation` | `sourceFormat`, `source` | LaTeX/MathML, källan bevaras | MathML/SVG, säker matematikrenderare | Vektor, fontfallback | Native ekvation om stödd, annars SVG/bild och källmetadata | MVP |
| `vectorPath` | `format` + `pathData` eller `svg` | Bézier, konturer, fyllning | SVG, sanerad | Vektor | Freeform/SVG om möjligt, annars bild | MVP |
| `inkStroke` | `points` | Penna/överstrykare, tryckdata | Canvas/SVG | Vektor | Frihandslinjer om möjligt, annars SVG/bild | Nästa |
| `model3D` | `assetRef`, `posterAssetRef` | Kameravinkel och poster | glTF/GLB viewer med säker fallback | Poster | 3D där kompatibelt, annars poster | Senare |
| `embeddedObject` | `assetRef`, `mimeType`, `posterAssetRef` | Bifogat innehåll, ej exekvering | Säkert nedladdningsobjekt | Poster/länk | OLE där säkert/stött, annars poster + bifogat | Senare |
| `codeBlock` | `source` | Text, språk och syntaxmarkering | `<pre>` med escaping | Sökbar text | Textruta med monospace | Nästa |
| `map` | `geoFormat` | GeoJSON eller markerad bild, attribution | SVG/Canvas | Statisk vektor/bild | Former eller bild | Senare |

**Ingen HTML-generator får exekvera LaTeX-makron, SVG-script, okänd inbäddad kod eller OLE automatiskt.** Alla importerade medier och dokument skall behandlas som opålitliga. `actions` är en deklarativ allowlist och får inte innehålla eval/JS-kod.

### 0.2 Förtydligade egenskaper

- `actions[]` på ett objekt beskriver `event`, `kind`, `targetId` eller `url`. Tillåtna åtgärder: navigera, öppna explicit URL, visa/dölj, sätt tillstånd, spela media. Användarinteraktion krävs för externa länkar; inga godtyckliga skript.
- `mediaPlayback` beskriver uppspelning, loop, ljud, start/slut, poster och captions. Videors ljudspår måste bevaras, men PDF använder poster.
- `textGeometry` kan beskriva text på bana eller warpad text. Textkällan förblir separat, redigerbar semantik.
- `fallbackAssetRef` pekar på en bildresurs när renderaren saknar stöd. Ursprunglig semantisk payload får inte raderas.
- `imageGallery`, `callout`, `button` och WordArt är **kompositioner/stilar**: galleri = komponent med bilder, knapp = form + `actions`, WordArt = rich text + `textGeometry`. Undvik dubbletter i objektkatalogen.
- `chart` (befintlig) utökas först via versionerade datastilar. Rekommenderade senare varianter: waterfall, funnel, radar, treemap, histogram, boxplot och kartdiagram. Inga nya chart-enumvärden har införts tyst i 0.3.

### 0.3 Semantisk validering utöver JSON Schema

1. Alla ID:n är entydiga i dokumentets tillämpliga namnrymder; alla `assetRef`, `posterAssetRef`, `fallbackAssetRef`, `targetId` och diagramkanter pekar på existerande objekt.
2. Noder i `semanticDiagram` har unika ID:n; kantreferenser måste finnas; en hierarki får inte ha cykler.
3. `vectorPath` SVG måste saneras: inga skript, `foreignObject`, fjärrlänkar eller externa referenser; `svg-path` måste kunna parsas.
4. `equation` använder säker delmängd och rendering utan externa nätverksresurser.
5. `model3D` måste ha statisk poster och definierade resursgränser; uppspelning får inte kräva nätverksanrop i offline-filen.
6. Ingen export får utge rasteriserade element för native-redigerbara. Exportlogg per objekt skall visa native/hybrid/raster/utelämnad och varningar.
7. Layoutlänkar och temaberoenden från v0.2 gäller fortsatt. Objektplacering och identitet får inte tappas vid roundtrip.

### 0.4 Migrering v0.2 → v0.3

- Behåll befintliga objekt som de är; sätt `schemaVersion` till `0.3.0` endast efter validerad migrering.
- Migrera äldre process/tidslinje/orgchart till `semanticDiagram` bara om nod-/kantsemantik säkert kan återskapas; annars bevara äldre elementtyp.
- Behåll gamla ID:n och `contentRef` där de redan finns; föreslå ingen automatiserad omnumrering.
- V0.3-läsare skall avvisa filer med framtida obligatoriska funktioner som inte stöds, och erbjuda read-only/fallback för frivilliga objekt.

### 0.5 Konkreta schemaexempel

```json
{
  "id": "diagram-1", "type": "semanticDiagram",
  "semanticDiagram": {
    "kind": "process",
    "nodes": [{"id":"n1","label":"Förbered"},{"id":"n2","label":"Besluta"}],
    "edges": [{"id":"e1","from":"n1","to":"n2","kind":"directed"}],
    "layout": {"algorithm":"flow","direction":"lr"}, "editable":true
  },
  "editability":"native"
}
```

```json
{
  "id":"formula-1", "type":"equation",
  "equation":{"sourceFormat":"latex","source":"E = mc^2","display":"block","altText":"Energi är massa gånger ljushastigheten i kvadrat"},
  "editability":"native"
}
```

### 0.6 Normativa acceptanstester för objektmodell

- **F-301:** Ändra semantisk diagrams nodtext och layout; text och relationer överlever spara → HTML → återimport → PPTX.
- **F-302:** Formel bevarar ursprunglig källsträng genom HTML/PDF/PPTX-export även om renderingen kräver raster/vektor.
- **F-303:** SVG med skript eller fjärrreferens avvisas; säker SVG renderas offline.
- **F-304:** Freehand strokes behåller ordning, koordinater och tryckpunkter genom roundtrip.
- **F-305:** 3D-modell visar poster när viewer är otillgänglig och ger korrekt exportvarning.
- **F-306:** En deklarativ knapp navigerar mellan slides utan godtycklig JS-exekvering.
- **F-307:** Okänt obligatoriskt objekt avvisas tydligt; känt frivilligt objekt med fallback visas säkert.
- **F-308:** Exportlogg redovisar per objekt när native-redigerbarhet inte kan uppnås.

---

## Tidigare v0.2-specifikation (fortsatt giltig där den inte ersätts ovan)

# Förslag till öppet, självbeskrivande presentationsformat

**Arbetsnamn:** Portable Presentation Document (PPD)  
**Förslagsversion:** 0.2  
**Status:** Diskussionsunderlag – inte en fastställd standard  
**Mål:** En presentation som är semantiskt begriplig, visuellt uttrycksfull, redigerbar, portabel och kan distribueras som **en enda självförsörjande HTML-fil**.

> **Läsanvisning v0.2:** Den ursprungliga v0.1-texten finns kvar för spårbarhet. Avsnitt 16 och senare utgör den **normativa v0.2-kompletteringen** och har företräde vid prioriteringskonflikter. Specifikationerna är utvecklingsunderlag, ännu inte fastställda standarder eller fullständiga JSON Schema.

## 1. Sammanfattning och designbeslut

Vi skiljer på fyra logiska modeller samt en distributionsbehållare:

1. **Innehålls- och semantikmodell (Content):** *Vad* presenteras, varför, i vilken ordning och med vilka relationer?
2. **Visuell modell (Design):** *Hur* innehållet ska se ut: bilder, objekt, geometri, typografi, effekter och lager.
3. **Presentations- och interaktionsmodell (Delivery):** *Hur* materialet visas: övergångar, fragment, talaranteckningar, presenterarläge, styrning och tillgänglighet.
4. **Resurs- och proveniensmodell (Assets & Provenance):** Vilka binära tillgångar, typsnitt, diagramdata, genereringsunderlag, licenser och ursprung används?
5. **Genererad representation (Build/Runtime):** Färdig HTML/CSS/JavaScript och inbäddade binärresurser, tillsammans med en maskinläsbar modell och information om dess överensstämmelse med presentationen.

**Normativ princip:** En *kanonisk dokumentmodell* är sanningskälla. Renderad HTML är ett härlett resultat. Renderingsmotorn kan vara Reveal.js, men dokumentformatet får inte vara beroende av Reveal.js.

**MVP:** Stöd först de objekt som normalt används i PowerPoint: texter, former, linjer, pilar, bilder, grupper, tabeller, diagram, listor, ikoner, medieobjekt, länkar och talaranteckningar; plus fotograferade bakgrunder, glasliknande effekter och animerade objekt.

## 2. Mål, avgränsningar och kvalitetskrav

### 2.1 Mål

- Självbeskrivande innehåll: struktur, budskap, objekt, alternativtexter, talaranteckningar, metadata.
- Bra återgivning: 16:9 som standard, men stöd för valbara sidmått och anpassade layouter.
- I första hand **en HTML-fil utan externa nätverksberoenden**, som fungerar offline.
- Separat redigeringsmodell och möjlighet att exportera en ny HTML-fil efter ändringar.
- Gemensam datamodell för rendering till HTML, PDF och på sikt PPTX.
- Tydlig skillnad mellan inbyggt redigerbara objekt och tillgångar/effekter som rasteriserats.
- Deterministisk validering, resursintegritet, formatversioner och testbarhet.

### 2.2 Avgränsningar i version 0.1

- Ingen fullständig import/export-paritet med alla PowerPoint-funktioner.
- Ingen samtidig fleranvändarredigering, ändringsspårning eller avancerade makron.
- Ingen godtycklig exekverbar kod från dokumentmodellen eller plugins i själva dokumentet.
- Ingen garanti att PDF/PPTX kan återge alla webbspecifika effekter pixelperfekt.
- Ingen redigering av enskilda motivdelar inuti fotorealistiska rasterbilder.

### 2.3 Rekommenderade interoperabilitetsnivåer

| Nivå | Egenskap | Krav |
|---|---|---|
| A – Content | Alla budskap och textfält är maskinläsbara | Obligatorisk |
| B – Visual | Objekt, lager, positions- och stilregler är maskinläsbara | Obligatorisk |
| C – Editable | Vanliga overlay-objekt kan återredigeras | MVP |
| D – Portable | Filen fungerar helt offline | MVP |
| E – Fidelity | Rasteriserade effekter kan återskapas eller ersättas med fallback | Successivt |
| F – Multi-format | Samma modell kan återges i HTML, PDF och PPTX | Successivt |

## 3. Logisk filorganisation och toppnivå

En kanonisk datamodell i JSON bäddas in i HTML-dokumentet. Exempel på *föreslagen* toppnivå:

```json
{
  "format": "ppd",
  "schemaVersion": "0.1.0",
  "document": {},
  "theme": {},
  "slides": [],
  "assets": {},
  "presentation": {},
  "provenance": {},
  "build": {}
}
```

**Grundregler:**

- Alla objekt har beständiga `id` (inte arraypositioner som identitet).
- Text- och dataelement kan refereras via `contentRef`; visuella objekt kopplas till det semantiska innehållet.
- Objekt och bilder lagras en gång och återanvänds med ID/referens där möjligt.
- Standardvärden är ärvbara: dokument → tema → mall/layout → slide → objekt.
- Okända utökningar placeras i ett namnrymdat `extensions`-objekt, exempelvis `extensions.vendorName`.
- En läsare måste förstå `schemaVersion` och får inte tyst ignorera okända *obligatoriska* funktioner.
- **Säkerhet:** Text och HTML-data får inte tolkas som körbar kod utan explicit sanering/escaping.

## 4. Dokumentmetadata (`document`)

| Fält | Typ | Beskrivning |
|---|---|---|
| `id` | string | Globalt unikt dokument-ID (t.ex. UUID) |
| `title` | string | Presentationens titel |
| `subtitle` | string? | Undertitel |
| `description` | string? | Sammanfattning och sökbar beskrivning |
| `language` | BCP 47 | Exempelvis `sv-SE` |
| `authors` | array | Namn/roll, eventuellt organisation |
| `createdAt`, `modifiedAt` | ISO 8601 | Tidsstämplar |
| `revision` | string/integer | Dokumentrevision, skild från schemaversion |
| `keywords` | string[] | Sökord |
| `audience`, `purpose` | string | Målgrupp och syfte |
| `classification` | string? | Hanterings-/sekretessklassning (metadata, **ej åtkomstskydd**) |
| `defaultAspectRatio` | string | `16:9`, `4:3`, custom |
| `canvas` | object | Referensmått, exempelvis 1600×900 logiska enheter |
| `rights` | object? | Upphovsrätt och återanvändning |
| `featureRequirements` | string[] | Nödvändiga formatfunktioner |

**Kommentar:** Klassning i dokumentet innebär inte kryptering eller faktiskt behörighetsskydd.

## 5. Innehålls- och semantikmodell (`slides[].content`)

Innehållsmodellen ska överleva byte av layout, tema och presentationsmotor. Den bör omfatta:

| Fält | Typ | Beskrivning |
|---|---|---|
| `id`, `order` | string, number | Stabil identitet och ordning |
| `kind` | enum | `title`, `agenda`, `section`, `content`, `comparison`, `process`, `data`, `closing`, `custom` |
| `title`, `subtitle` | rich text / string | Rubrik och underrubrik |
| `purpose`, `keyMessage` | string | Avsikt och huvudbudskap |
| `summary`, `body` | rich text | Beskrivande text |
| `blocks` | array | Semantiska innehållsblock med egna ID |
| `relationships` | array | Logiska relationer mellan innehållsblock |
| `speakerIntent` | string? | Vad presentatören särskilt ska framhäva |
| `audienceTakeaway` | string? | Vad publiken ska komma ihåg |
| `sources` | array | Källhänvisningar, tidsstämpel och eventuell licens |
| `altSummary` | string | Övergripande textalternativ |

### 5.1 Innehållsblock – första objektkatalogen

| `kind` | Semantik | Exempel |
|---|---|---|
| `text` | Rubrik, ingress, brödtext, citat, fotnot | Text i punktlista |
| `list` | Ordnad, oordnad, checklista | Agenda eller beslut |
| `figure` | Illustrativ figur / fotografi | Kontorsbild |
| `callout` | Framhävt budskap | Informationskort |
| `table` | Rad-/kolumnbaserad data | Jämförelse |
| `chart` | Kvantitativa data och visualisering | Stapel-, linje- eller cirkeldiagram |
| `metric` | Nyckeltal med enhet och kontext | 85 % |
| `process` | Steg och kopplingar | Arbetsflöde |
| `diagram` | Noder och relationer | Organisations- eller arkitekturdiagram |
| `media` | Video/ljud med textalternativ | Kort klipp |
| `reference` | Länk, källa, bilaga | Källnot |

Semantiskt innehåll ska inte innehålla godtyckliga CSS-positioner. Visuell ordning och visuell styling hör till Design.

### 5.2 Rich text

Använd en strukturerad rich-text-modell, t.ex. stycken med `runs`, där varje run kan ha `text`, `emphasis` (bold/italic/underline), `link` och eventuellt `language`. Liststrukturer ska modelleras som listor, inte som en sträng med punkttecken.

## 6. Visuell modell (`theme`, `slides[].view`)

### 6.1 Dokumenttema (`theme`)

- **Färgpalett:** semantiska design tokens, t.ex. `surface`, `text`, `accent`, `muted`, `danger` samt stöd för ljus/mörk variant.
- **Typografi:** font stack, storleksskala, vikt, radavstånd, teckenavstånd och fallbacks; endast inbäddade typsnitt med lämplig licens.
- **Spacingsystem:** avståndsskala, grid, marginaler, hörnradier.
- **Effekter:** skuggor, blur, stroke och opacitetsvariabler.
- **Layouter:** namngivna mallar (`hero`, `two-column`, `data`, `quote`, `process`).
- **Kontrast och läsbarhet:** lägsta textstorlek och kontrastmål i komponenterna.
- **Deklarativa fallbackstilar:** exempelvis tonad halvtransparent yta om `backdrop-filter` saknas.

### 6.2 Slidevy (`slides[].view`)

| Fält | Typ | Beskrivning |
|---|---|---|
| `layout` | string | Mall/layout-ID |
| `background` | object | Färg, bild, gradient, position, skala, filter |
| `viewport` | object? | Säkerhetsmarginaler, beskärning, skalningspolicy |
| `elements` | array | Objekt och gruppering i presentationsytan |
| `guides` | array? | Hjälplinjer (endast redigerare) |
| `accessibilityOrder` | string[] | Läsordning oberoende av z-index |

### 6.3 Gemensam objektbas (`VisualElement`)

Varje objekt – även bilder och former – får en stabil uppsättning gemensamma egenskaper:

| Fält | Typ | Beskrivning |
|---|---|---|
| `id` | string | Stabil identitet |
| `type` | enum | `text`, `shape`, `line`, `image`, `group`, `table`, `chart`, `icon`, `media`, `connector` |
| `contentRef` | string? | Referens till innehållsblock eller textfält |
| `name` | string? | Begripligt namn i lagerpanelen |
| `box` | object | `x`, `y`, `width`, `height` i logiska designenheter |
| `anchor` | object? | Ankare och responsiva restriktioner |
| `rotation` | number | Rotation i grader |
| `zIndex` | integer | Lagerordning |
| `visible`, `locked` | boolean | Visning och redigeringslås |
| `opacity` | 0..1 | Total opacitet |
| `style` | object | Typberoende utseende |
| `effects` | array | Skugga, glow, blur, filter och gradient |
| `interactions` | array? | Länkar och händelser |
| `animations` | array? | Objektanimationer |
| `altText` | string? | Textalternativ för visuella objekt |
| `editability` | enum | `native`, `data`, `raster`, `locked` |
| `fallback` | object? | Alternativ återgivning vid export |
| `extensions` | object? | Namespacade tillägg |

Positionsvärden har **kanvasenhet**, inte Pixlar för en viss skärm. Exempel: en kanvas på 1600×900 där elementens koordinater kan transformeras vid skalning. Koordinatursprung uppe till vänster. `zIndex` och arrayordning ska ha en definierad, deterministisk konfliktregel.

### 6.4 Objekttyper i MVP

| Objekt | Nödvändiga egenskaper | Kommentar |
|---|---|---|
| Textruta | Rich text, marginaler, justering, overflow, radbrytning | Text ska kunna ändras direkt |
| Punktlista | Semantisk lista + stycke-/punktstilar | Stöd för nivåer/indrag |
| Form | Rektangel, rundad rektangel, cirkel, triangel, polygon, pratbubbla | Fyllning, kant, radie |
| Linje/pil | Start/slut, linjestil, pilspetsar | Kan kopplas till former |
| Connector | Från/till nod, fästen, kurva/ortogonal | Automatisk uppdatering vid flytt |
| Bild | Asset-ID, crop, fit, mask, filter, alt-text | Bakgrund eller förgrund |
| Grupp | Barn-ID:n, lokal transform, gemensam style | Grupperad flytt/skala |
| Ikon | Inbäddad SVG eller deklarativ symbol, färg | Säker SVG-sanitisering |
| Tabell | Celler, merge, rubrikrader, kant, alignment | Tillgänglighetssemantik |
| Diagram | Datakälla, typ, serier, axlar, etiketter, legend | Data separerade från figur |
| Nyckeltal | Värde, enhet, källa, visningsformat | Inte enbart bildbaserad text |
| Video/ljud | Asset-ID, poster, autostart, textning | MVP kan börja med enklare stöd |
| Hyperlänk | URL, mål och visningsetikett | Ingen exekverbar `javascript:`-URL |
| SVG-baserat diagram | Strukturerade noder/kanter och visuell fallback | Importerade SVG kan sakna redigerbar struktur |

### 6.5 Stil och effekter

Stöd följande deklarativa effektklasser:

- `fill`: solid, gradient (linjär/radiell), mönster, bild.
- `stroke`: färg, bredd, dash, opacitet.
- `shadow`: x/y-offset, blur, spread, färg, opacitet.
- `filter`: blur, brightness, contrast, saturation, color overlay.
- `backdrop`: backdrop blur/saturation – särskilt för frostat glas.
- `mask` / `clip`: rundade kanter, former.
- `blendMode`: från en *tillåten lista*, inte godtyckliga CSS-uttryck.
- `opacity`: per element och per fyllning/linje.

**Viktigt för hybridfall:** Skilj mellan en *semantisk panel* med ett deklarativt glaseffekt-recept (`editability: native`) och en *färdigrenderad effektbild* (`editability: raster`). För det senare bör ursprungsrecept, basbild, masker och eventuell renderingsprompt kunna registreras, så att effekten kan återskapas när renderaren stödjer det.

## 7. Presentations- och interaktionsmodell (`presentation`)

| Fält | Typ | Beskrivning |
|---|---|---|
| `initialSlideId` | string | Startbild |
| `navigation` | object | Pilknappar, tangentbord, touch, direktlänkar |
| `slideTransitions` | object | Typ, varaktighet, easing |
| `fragments` | array | Stegvis framträdande av objekt |
| `timeline` | array | Animationstriggers, fördröjning och ordning |
| `speakerNotes` | per slide | Presentatörens manus/anteckningar |
| `estimatedDurationSeconds` | per slide | Rekommenderad tid |
| `presenterView` | object | Klocka, anteckningar, nästa bild |
| `print` | object | PDF-/utskriftsprofil, marginaler, bakgrunder |
| `accessibility` | object | Fokusordning, reducerad rörelse, tangentbordsstöd |
| `language` | string? | Språk för uppläsning/textning |

Föreslagna animationstyper för MVP: `fade`, `slide`, `scale`, `appear`, `emphasis`, `none`. Animationer pekar på stabila objekt-ID:n, inte CSS-selektorer. `prefers-reduced-motion` ska respekteras. Presentationsläge och redigeringsläge ska vara tydligt separerade.

## 8. Resurs- och proveniensmodell (`assets`, `provenance`)

En resurs kan vara bild, font, ljud, video eller diagramdata.

```json
{
  "assets": {
    "office-bg": {
      "kind": "image",
      "mimeType": "image/webp",
      "width": 1920,
      "height": 1080,
      "hash": "sha256:<beräknat-värde>",
      "storage": "embedded",
      "uri": "data:image/webp;base64,<...>",
      "altText": "Ljust nordiskt kontor med utsikt över vatten",
      "license": {"type": "user-provided", "attribution": null},
      "source": {"kind": "generated", "generationRef": "generation-office-01"}
    }
  }
}
```

### 8.1 Proveniens för AI-genererat material

Förslagsfält:

- `createdBy`: människa, AI, importerat objekt eller automatiskt program.
- `generator`: verktyg, modellversion (om känd), tidsstämpel.
- `prompt` / `promptRef`: generationens underlag, om lämpligt att spara.
- `inputAssetRefs`: vilka ingångsbilder eller andra underlag som användes.
- `parameters`: kända parametrar, som storlek och stil.
- `transformations`: beskärning, komprimering, maskering, blur, overlay och färgjusteringar.
- `rights`: användningsrätt/upphovsrättsinformation och eventuell attribution.
- `confidence`: valfritt, källbundet kvalitetsmått – får inte vara en påhittad sannolikhet.

**Integritet:** Promptar, namn, anteckningar och importerade resurser kan innehålla känsligt material. Formatet bör stödja att sådana uppgifter stryks vid export med en `privacyProfile`, exempelvis `full`, `shareable`, `minimal`.

## 9. Genererad representation (`build`) och enfilspaketering

### 9.1 HTML-behållaren

En komplett fil `presentation.html` kan innehålla:

1. Kanonisk JSON-modell som inbäddad `script type="application/json"`.
2. Kompilerad presentations-HTML: en lätt DOM-struktur eller en skalstruktur som byggs från modellen vid öppning.
3. All CSS: tema, effektstilar, responsivitet och utskrift.
4. All JavaScript: nödvändig Reveal.js-kod, projektspecifik renderare och eventuell editor.
5. Resurser som data-URI eller andra inbäddade representationsformer.
6. `build`-manifest: verktygsversion, byggtid, målrenderare, hash, funktionsstöd och eventuella fallbacks.

**Rekommenderad strategi:** Lagra en enda kanonisk JSON-modell och generera slide-DOM vid uppstart. På så sätt blir det ingen konkurrerande andra sanningskälla i genererad HTML.

```html
<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Exempelpresentation</title>
  <style>/* Inbäddade stilar och renderarens CSS */</style>
</head>
<body>
  <div id="presentation-root"></div>
  <script id="ppd-data" type="application/json">
  {"format":"ppd","schemaVersion":"0.1.0","document":{},"theme":{},"slides":[],"assets":{},"presentation":{},"provenance":{},"build":{}}
  </script>
  <script>/* Inbäddad, betrodd runtime. Läser och validerar ppd-data. */</script>
</body>
</html>
```

Detta är en **illustration av behållarformen**, inte ett körbart komplett exempel. Vid serialisering ska minst `</script>` och andra HTML-känsliga tecken skyddas i JSON (t.ex. `\u003c`).

### 9.2 Publicering

- **Lokal användning:** Dubbelklick på HTML-filen; inget nätverk får krävas.
- **PWA Preview:** Paketera samma `index.html` i en ZIP/tar.gz för tjänstens nuvarande importgränssnitt.
- **PDF:** Exportera från Chromium eller jämförbar renderarmiljö med definierade sidmått och tryckprofil.
- **PPTX:** Framtida export med redigerbara native-objekt där möjligt; avancerad CSS och backdrop blur kan kräva raster-fallback.

### 9.3 Export av ändringar

Editorändringar uppdaterar modellen i minnet, följt av ny rendering. Funktionen **Exportera HTML** serialiserar den uppdaterade kanoniska modellen och befintliga inbäddade runtime/resurser till en ny fristående HTML-fil. Browsern kan i allmänhet inte skriva över den öppnade lokala filen utan explicit filåtkomst via användarinteraktion.

## 10. Genomarbetat slide-exempel (komprimerat)

Exemplet visar en av bilderna vi diskuterat: fotorealistisk kontorsbakgrund, premiumrubrik, glasliknande panel och presenterarnoteringar. Bakgrundstillgångens Base64 och fullständiga stildefinition är utelämnade för läsbarhet.

```json
{
  "format": "ppd",
  "schemaVersion": "0.1.0",
  "document": {
    "id": "doc-premium-demo",
    "title": "Digital utveckling",
    "language": "sv-SE",
    "defaultAspectRatio": "16:9",
    "canvas": {"width": 1600, "height": 900, "unit": "logical"}
  },
  "theme": {
    "id": "nordic-premium",
    "colors": {"ink": "#102537", "white": "#FFFFFF", "accent": "#E7C9A3"},
    "typography": {"heading": "Georgia, serif", "body": "Arial, sans-serif"}
  },
  "slides": [{
    "id": "slide-intro",
    "order": 1,
    "content": {
      "kind": "title",
      "purpose": "Introducera ämnet",
      "keyMessage": "Digital utveckling behöver en tydlig riktning",
      "blocks": [
        {"id": "heading", "kind": "text", "role": "heading", "text": "Digital utveckling"},
        {"id": "lead", "kind": "text", "role": "lead", "text": "Med fokus på verksamhetsnytta"},
        {"id": "insight", "kind": "callout", "title": "Designprincip", "body": "Budskap och bakgrund samspelar."}
      ],
      "altSummary": "Titelbild mot ljust kontorsfoto med en glasliknande informationspanel."
    },
    "view": {
      "layout": "hero-glass",
      "background": {"type": "image", "assetRef": "office-bg", "fit": "cover", "focalPoint": [0.55, 0.48]},
      "elements": [
        {"id": "title-visual", "type": "text", "contentRef": "heading", "box": {"x": 96, "y": 120, "width": 660, "height": 150}, "zIndex": 10, "style": {"fontToken": "heading", "fontSize": 74, "colorToken": "white"}, "editability": "native"},
        {"id": "lead-visual", "type": "text", "contentRef": "lead", "box": {"x": 96, "y": 300, "width": 560, "height": 100}, "zIndex": 11, "style": {"fontToken": "body", "fontSize": 30, "colorToken": "white"}, "editability": "native"},
        {"id": "glass-panel", "type": "shape", "box": {"x": 1050, "y": 180, "width": 420, "height": 260}, "zIndex": 5, "style": {"fill": {"color": "#FFFFFF", "opacity": 0.22}, "cornerRadius": 26}, "effects": [{"type": "backdropBlur", "radius": 24}, {"type": "shadow", "blur": 30, "opacity": 0.18}], "editability": "native"},
        {"id": "insight-visual", "type": "text", "contentRef": "insight", "box": {"x": 1090, "y": 230, "width": 345, "height": 140}, "zIndex": 12, "style": {"fontToken": "body", "colorToken": "ink"}, "editability": "native"}
      ],
      "accessibilityOrder": ["title-visual", "lead-visual", "insight-visual"]
    },
    "delivery": {
      "speakerNotes": "Beskriv först målbilden, därefter principen om samspelet mellan innehåll och visualisering.",
      "estimatedDurationSeconds": 75,
      "transition": {"type": "fade", "durationMs": 400},
      "fragments": [{"elementId": "glass-panel", "order": 1}, {"elementId": "insight-visual", "order": 1}]
    }
  }],
  "assets": {"office-bg": {"kind": "image", "mimeType": "image/webp", "storage": "embedded", "uri": "data:image/webp;base64,<utelämnat>", "altText": "Fotorealistiskt nordiskt kontor vid vattnet"}},
  "presentation": {"initialSlideId": "slide-intro", "navigation": {"keyboard": true, "touch": true}, "print": {"includeBackgrounds": true}},
  "provenance": {"privacyProfile": "shareable"},
  "build": {"target": "html-reveal", "rendererVersion": "0.1.0", "selfContained": true}
}
```

**Observera:** För att bli ett komplett implementationsschema behöver exemplet formaliseras med JSON Schema och preciserade union-typer. I synnerhet ska `contentRef` kunna peka på ett specificerat delfält (t.ex. `insight.title` eller `insight.body`) eller så ska dessa ha egna block-ID:n. I exemplet används hela callout-blocket som genväg.

## 11. Regler för referenser, identitet och redigerbarhet

1. ID:n måste vara unika inom dokumentet enligt fastställda scopes.
2. `contentRef`, `assetRef`, `from` och `to` måste kunna resolvas.
3. Flytt av ett visuellt objekt får inte ändra dess semantiska innehåll.
4. Ändring av innehållsblock ska slå igenom i alla dess visualiseringar.
5. Objekt med `editability: raster` ska inte presenteras som objekt som kan ändras separat.
6. Export med fallback ska redovisa vilka objekt som förlorat redigerbarhet.
7. En modelländring ska markera eller regenerera beroende renderade artefakter.
8. Historik bör hanteras i revisioner/snapshots, inte genom att förlita sig på DOM:ens aktuella utseende.
9. Redigeraren ska kunna visa objektens semantiska roll, lagerordning och ursprung.

## 12. Validerings- och kvalitetsregler

### 12.1 Schemakontroller (fel)

- Felaktig `schemaVersion` eller saknade obligatoriska fält.
- Ogiltiga ID:n, dubbletter, trasiga referenser eller cykliska grupper.
- Oändliga/NaN-mått, negativa bredder/höjder eller ogiltiga opaciteter.
- Förbjudna URI-scheman eller osäkra HTML/SVG-element.
- Ogiltig ordning av animationstriggers eller referenser till borttagna objekt.
- Saknade inbäddade resurser för en presentation som anger `selfContained: true`.
- Hashvärden som inte stämmer mot resursinnehållet.

### 12.2 Kvalitetskontroller (varning)

- Text som kan klippas eller blir för liten.
- Otillräcklig kontrast mellan text och fotografisk bakgrund.
- Överlappande element som inte uttryckligen tillåts.
- För många dekorativa paneler eller informationsobjekt på samma slide.
- Komplexa övergångar utan alternativ för reducerad rörelse.
- Saknad alternativtext, källa, licens eller osäkra formuleringar om bildens ursprung.
- Avsaknad av semantiska tabellrubriker.
- PPTX-fallback som rasteriserar objekt användaren förväntar sig kunna redigera.

### 12.3 Definition av färdig MVP

En leverans bör uppfylla följande:

- En enda HTML-fil fungerar offline i moderna webbläsare.
- Tre slides kan navigeras med tangentbord och touch.
- Text, enkla former och informationspaneler kan redigeras och återexporteras till HTML.
- Bakgrundsbild med glasliknande CSS-effekt återges i en modern Chromium- och Safari-miljö (eller har explicit fallback).
- Objekt går att identifiera i JSON-modellen och visas med korrekt läsordning.
- PDF-export ger förutsägbart format utan klippta texter.
- Minst en tabell, en enkel datagraf, en grupp, en pil och en hyperlänk kan återges.
- Alla externa runtimeberoenden och bildresurser är inbäddade.
- Validering rapporterar både hårda fel och kvalitetsvarningar.

## 13. Föreslagen stegvis utveckling

### Etapp 0 – Formatbeslut

Fastställ ID-regler, JSON Schema, rich-text-modell, koordinatsystem, referensmekanism och minsta säkerhetsprofil. Skapa en versionshanterad specifikation och exempeldata.

### Etapp 1 – Visuell MVP

Implementera text, former, linjer/pilar, bilder, transparens, gradienter, skuggor, backdrop blur, lager, grupper, slide-navigering och fristående HTML-export. Börja med vår fotorealistiska premiumslide.

### Etapp 2 – Vanliga PowerPoint-objekt

Lägg till tabeller, diagram, punktlistor på flera nivåer, ikoner, standardiserade processdiagram, länkar, grundläggande animationer och presenterarnoteringar.

### Etapp 3 – Editor och presentationsfunktioner

Skapa objekt- och lagerpanel, egenskapsredigering, tema/layoutval, dra-och-släpp, återställning/ångra, tillgänglighetskontroller, PDF-export och reviderbar HTML-export.

### Etapp 4 – Interoperabilitet

Inför PPTX-import/export för en avgränsad delmängd. Använd deklarerade rasterfall-backar där exakt native-återgivning inte går. Utöka automatiserade acceptanstester och jämför skärmbilder mellan renderare.

## 14. Öppna arkitekturfrågor

1. **Rich text:** Egen enkel struktur, ProseMirror-liknande modell eller annat etablerat dokumentformat?
2. **Layout:** Absoluta logiska koordinater som standard, med constraints, eller kombination med CSS grid/flex för responsiva format?
3. **Diagram:** Separera rådata och visualiseringsspecifikation på ett sätt som kan mappas till både SVG/Canvas och PPTX?
4. **Renderingsmotor:** Reveal.js för navigering, plus egen objekt-renderare – eller minimal egen presentationsmotor?
5. **Tillgångar:** Base64-data-URI direkt i kanonisk JSON eller resurstabell separat från datamodellen inne i samma HTML?
6. **Genereringsmetadata:** Vilka prompts och AI-parametrar är relevanta att spara, och vilka ska utelämnas av integritetsskäl?
7. **Teman:** Ska alternativa teman och ljus/mörk anpassning följa med samma fil?
8. **Spårbarhet:** Hur kopplas semantiska ändringar till regenererade visualiseringar i framtida revisioner?
9. **PPTX-fidelitet:** Vilka objekt måste vara native i exporten och vilka får rasteriseras?
10. **Säkerhet:** Hur begränsar vi importerad SVG/HTML, filstorlek, media och innehåll från externa dokument?

## 15. Rekommenderad nästa leverans

Bygg en **vertikal prototyp** med samma fotorealistiska presentationsbild i tre varianter: titelbild, innehållsbild med glaspanel och diagram-/processbild. Följ kedjan:

`kanonisk JSON → schema-validering → genererad fristående HTML → redigering → ny HTML-export → PDF → visuell acceptanskontroll`

Första versionsmålet är inte maximal PowerPoint-kompatibilitet, utan att **styrka att ett enda filformat kan bära både maskinläsbar kunskap och ett professionellt presentationsuttryck**. Därifrån kan vi prioritera fler objekttyper och native-PPTX-export.


## 16. Tillägg i PPD 0.2 – normativ komplettering

### 16.1 Normativitet, omfång och kompatibilitet

Detta avsnitt gäller före motstridiga prioritets- och fältförslag i avsnitt 1–15 (bevarad v0.1-bas). **M** = ingår i MVP, **B** = nästa etapp, **F** = framtid. Fält markerade som valfria får utelämnas; läsaren måste bevara okända utökningar vid round-trip när det är säkert. `schemaVersion` är `0.2.0` för dokument som nyttjar v0.2. `minReaderVersion`, `featureRequirements` och `extensions` avgör om en fil kan öppnas i redigerbart, nedgraderat eller endast läsbart läge. **Inget formatkrav får betyda att webbläsarens editorläge måste sparas i dokumentet.**

Den logiska toppnivån från v0.1 behålls: `format`, `schemaVersion`, `document`, `theme`, `slides`, `assets`, `presentation`, `provenance`, `build`. Två valfria samlingar införs: `masters` och `components`. `document` får `pageSetup`, `defaultMasterId`, `defaultLayoutId`; `slides[]` får `masterId`, `layoutId`, `placeholderBindings`, `sectionId`. Existerande v0.1-fält förblir giltiga om inget annat uttryckligen anges.

### 16.2 Master, layout och platshållare – PPD-F-201…205 (M)

- **PPD-F-201:** `masters[]` definierar varaktiga master-ID:n, generella bakgrundsobjekt, sidhuvud/sidfot, logotyp, tema- och layoutreferenser; ärvning ska vara deterministisk.
- **PPD-F-202:** `masters[].layouts[]` definierar namngivna layouter (titel, innehåll, två kolumner, bild + text, tom) och deras platshållare. En platshållare har `id`, `role`, `geometry`, `styleRef`, valfri `required` och eventuell `defaultContent`.
- **PPD-F-203:** En slide binder innehåll via `placeholderBindings[{placeholderId,contentRef|elementId}]`. Overrides begränsas till explicit angivna egenskaper; saknade overrides ärvs.
- **PPD-F-204:** `layoutId` och `masterId` måste referera till existerande och kompatibla objekt. Ingen tyst ombindning av roller som `title`, `body`, `image`, `footer`.
- **PPD-F-205:** Byte av master/layout ska bevara semantiken, flytta till tillgängliga platshållare enligt dokumenterad regel och rapportera obundna element. Värden som skrivits över lokalt måste överleva byte och återställning av layout.

### 16.3 Rik text – PPD-F-210…214 (M)

- **PPD-F-210:** `text.paragraphs[]` innehåller `id`, `paragraphStyle`, och `runs[]` med `text`, `marks` (`bold`, `italic`, `underline`, `strike`), `fontFamily`, `size`, `color`, `link` och `language`; vanlig `plainText` får finnas som härledd/cachelagrad form men är inte en andra sanningskälla.
- **PPD-F-211:** Stycken stöder listor med nivå, markör, startvärde, indrag, tabbstopp, justering, rad- och styckeavstånd samt textvertikaljustering.
- **PPD-F-212:** Textbehållare skiljer mellan `overflow` (`clip`, `shrink-to-fit`, `expand-height`, `warn`) och `autoFit` samt har definierad radbrytnings- och språkstrategi. `warn` rekommenderas som redigeringsstandard; minsta tillåtna typsnitt styrs av tema.
- **PPD-F-213:** Inbäddade länkar, formateringsruns och flernivålistor måste överleva spara/öppna och behållas som redigerbara data vid PPTX-export där möjligt.
- **PPD-F-214:** Text på flera språk, specialtecken, unicode, kopierade HTML-fragment och radbrytningar ska serialiseras säkert utan exekverbar injektion.

### 16.4 Geometri, relationer och redigeringsrelevanta objektdata – PPD-F-220…226 (M)

- **PPD-F-220:** Varje visuellt objekt har `id`, `type`, `geometry` (`x,y,width,height,rotation`), `zIndex`, `visible`, `locked`, `styleRef|style`, `accessibility` och `exportPolicy`.
- **PPD-F-221:** `groups` innehåller ordnade barnreferenser och en lokal koordinattransformation. En objektreferens får inte ingå i flera primära grupper; cirklar förbjuds.
- **PPD-F-222:** Pilar/linjer ska stödja `startAnchor`, `endAnchor`, bindning till andra objekts ID:n och ett definierat fallbackläge om målet tas bort.
- **PPD-F-223:** Återanvändbara `components[]` innehåller struktur, stilvariabler och `slots`; instanser refererar `componentId` och `overrides` för synliga förändringar. **M:** fristående sparade komponenter och instanser; **B:** global propagationsredigering av bibliotek över dokumentgränser.
- **PPD-F-224:** Objekt kan ha `altText`, `decorative`, `readingOrder`; text och betydelse får inte bara ligga i en bitmap.
- **PPD-F-225:** `geometry` lagras i presentationsytans logiska enheter, inte CSS-skärmpixlar; transformordning (föräldragrupp → objekt → effekt) är fixerad.
- **PPD-F-226:** Stödlinjer, markeringar, senaste urval, zoomnivå och editorpanelers status är i grunden **editor-state**, inte delar av det publicerade dokumentet. Dokumentfasta objektbegränsningar (`locked`, positioneringsconstraints) lagras dock.

### 16.5 Bildresurser, diagram och tabeller – PPD-F-230…238

- **PPD-F-230 (M):** Bildobjekt kan referera `assetId`, `crop` (normerat rektangulärt urval), `fit` (`contain`, `cover`, `stretch`), `focalPoint`, mask/clip, justeringar (brightness/contrast/saturation) och alt-text.
- **PPD-F-231 (M):** Byte av bild ska bevara beskärningsinställningar när det går, annars kräva tydlig bekräftelse.
- **PPD-F-232 (M):** `tables[]` har rad-/kolumn-ID, cell-ID, `rowSpan/colSpan`, typad celltext, kantlinjer, fyllning, mått och stöd för läsordning.
- **PPD-F-233 (M):** `charts[]` har `chartType` (`bar`, `line`, `pie`), `dataset` med typade fält/värden, kategorier, serier, etiketter, skalor, färger och legend. Diagrammet är redigerbart från data, inte enbart en bild.
- **PPD-F-234 (M):** Diagram har tillgängligt tabellalternativ och deklarerad fallback för PDF/PPTX (native diagram om möjligt, annars bild med data bevarad i PPD).
- **PPD-F-235 (B):** Processer/tidslinjer/organisationsträd representeras som semantiska noder och relationer och kan få flera utseenden utan att förlora strukturen.
- **PPD-F-236 (B):** Diagramtyper såsom area, scatter, kombination, staplad och sekundäraxlar.
- **PPD-F-237 (M):** Basnivån för ikoner och figurer omfattar typade SVG-/geometriobjekt, inklusive markörfärger.
- **PPD-F-238 (M):** Datadiagram får inte få tyst ändrade skalor eller sorter vid export.

### 16.6 Presentation och metadata – PPD-F-240…245

- **PPD-F-240 (M):** `presentation` kan innehålla talaranteckningar per slide, valfri förväntad taltid, standardövergång och inkrementella visningssteg med stabila ID:n.
- **PPD-F-241 (M):** Varje slide får `sectionId`, tillgänglig titel och valfri `hidden` för presentationsordning.
- **PPD-F-242 (M):** Övergångar/animationer ska ha deklarerad statisk fallback för PDF och PPTX.
- **PPD-F-243 (B):** Hyperlänkar till specifika slides, förgreningar och interaktiva navigeringsmål.
- **PPD-F-244 (B):** Kommentarer/granskningsstatus refererar stabila slide-/objekt-ID:n och har `author`, `createdAt`, `status`, `thread`; får publiceras eller utelämnas enligt explicit exportval.
- **PPD-F-245 (M):** Presentationen ska alltid kunna läsas utan animationer eller JavaScript-drivna berättarsteg via fallbacks.

### 16.7 Bevarande, exportkontrakt och redigerbarhetsklass – PPD-F-250…257 (M)

- **PPD-F-250:** `exportPolicy` anger `editable-preferred`, `visual-preferred` eller `flatten-allowed` per objekt, med möjlig användaröverstyrning vid export.
- **PPD-F-251:** Varje export skapar en rapport per slide/objekt: `native`, `hybrid`, `rasterized`, `omitted`, `unsupported` samt orsak och kvarvarande semantik.
- **PPD-F-252:** PPTX-export ska prioritera redigerbar text, former, tabeller och bilder. Komplexa effekter får rasteriseras som **separata effektlager** med redigerbara innehållsobjekt ovanpå.
- **PPD-F-253:** PDF-export ska behålla text/vägar som vektor där möjligt; exporterade sidor måste ha rätt sidmått, sidordning och läsbarhet.
- **PPD-F-254:** Exportprofiler deklareras i `build` eller exportmanifest men ändrar aldrig originalmodellens semantik.
- **PPD-F-255:** Publicerad HTML innehåller inte oskyddade lokala sökvägar eller nätverksberoenden i standardprofilen `offline-single-file`.
- **PPD-F-256:** Ingen dataförlust tillåts tyst vid import/export; `roundTripReport` ska visa ignorerade, förenklade eller migrerade fält.
- **PPD-F-257:** `build.sourceModelHash` kopplas till den kanoniska modellen så att inkonsekvent cache/rendering upptäcks.

### 16.8 Versionshantering, säkerhet och bakåtkompatibilitet

- `revision` ökas när kanoniskt innehåll ändras och följer med vid sparning. **Editorhistorik/undo och kraschåterställning lagras separat**, om inte användaren explicit väljer en dokumentrevision.
- Läsare av 0.1 ska få ett diagnostiskt kompatibilitetsläge för 0.2 med okända funktioner; en 0.2-läsare får uppgradera 0.1 efter validering och en dokumenterad migrering.
- Alla externa resurser betraktas som otillförlitliga; JavaScript, event-attribut och okända URI-scheman får inte exekveras via semantik- eller objektdata.
- För enfilspublicering: inbäddade resurser ska ha rätt innehållstyp och kontrolleras mot angiven hash, källmetadata och tillåten licens.
- JSON i HTML bäddas in med korrekt escaping av sekvenser som kan avsluta `script`-elementet.

### 16.9 Minsta giltiga 0.2-exempel (illustrativt kontrakt)

```json
{
  "format": "ppd",
  "schemaVersion": "0.2.0",
  "document": {"id":"doc-1","title":"Strategi","defaultMasterId":"master-1","canvas":{"width":1600,"height":900}},
  "theme": {"colors": {"ink":"#102231"}},
  "masters": [{"id":"master-1","layouts":[{"id":"layout-title","placeholders":[{"id":"ph-title","role":"title","geometry":{"x":100,"y":90,"width":1200,"height":180}}]}]}],
  "components": [],
  "slides": [{"id":"slide-1","masterId":"master-1","layoutId":"layout-title","content":{"blocks":[{"id":"headline","type":"heading","text":{"paragraphs":[{"id":"p1","runs":[{"text":"Digital utveckling","marks":["bold"]}]}]}}]},"placeholderBindings":[{"placeholderId":"ph-title","contentRef":"headline"}],"view":{"elements":[]}}],
  "assets": {}, "presentation": {}, "provenance": {}, "build": {}
}
```

Exemplet visar relationer och är **inte** ett färdigställt maskinvalidbart JSON Schema. Fram till dess att ett kanoniskt JSON Schema fastställts ska implementatörer inte tolka exempelobjekt som fullständiga definitioner.

### 16.10 Spårbarhet och verifiering

| Formatkrav | Verktygskrav i v0.2 | Kontrolleras genom |
|---|---|---|
| PPD-F-201–205 | PPD-S-201–205 | Ändra master/layout och kontrollera ärvning/overrides |
| PPD-F-210–214 | PPD-S-210–214 | Rich-text round-trip + PPTX-öppning |
| PPD-F-220–226 | PPD-S-220–227 | Grupp, justering, layer/lock och sparning |
| PPD-F-230–238 | PPD-S-230–239 | Beskärning, tabell/diagram och export |
| PPD-F-240–245 | PPD-S-240–244 | Presenterarläge och statisk fallback |
| PPD-F-250–257 | PPD-S-250–260 | Exportjämförelser, varningsrapport, integritet |

### 16.11 Förändringslogg mot v0.1

1. Inför tydlig master/layout/platshållarstruktur och komponentinstanser.
2. Definierar rik text, stycken, overflow och inbäddade länkar.
3. Preciserar grupper, objektankare, koordinater och skillnaden mellan dokumentmodell och editor-state.
4. Flyttar grundläggande redigerbara diagram och celltabeller till MVP.
5. Förtydligar bildbeskärning och bildbyte.
6. Specificerar anteckningar, sektioner, exportklasser och round-trip-rapporter.
7. Etablerar referenser mellan formatkrav och funktionella krav; samtliga prioriteringsändringar i v0.1 ersätts av v0.2.
