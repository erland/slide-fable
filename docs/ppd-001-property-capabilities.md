# PPD-001 – Objektegenskaper, förmågor och formatbehov

**Datum:** 2026-10-21  
**Status:** Analys och beslutsunderlag – inga förändringar i PPD-schema eller produktionskod.  
**Underlag:** `schemas/ppd.schema.json`, `src/core/model.ts`, `src/core/editor.ts`, `src/ui/EditorApp.tsx` samt tidigare release-/exportgranskning. Verifierad rendering och exportparitet per rad kräver särskilda tester.

## Rekommendation i korthet

**Ändra inte PPD-formatet ännu.** Det befintliga `element.style` kan redan innehålla `fill`, `stroke`, `strokeWidth`, `color`, `fontSize`, `fontFamily`, `fontWeight`, `align`, `verticalAlign`, `opacity` och `padding`, oavsett objektets `type`. Både `text` och `shape` kan ha `text`/`contentRef`. Detta räcker som *modellrepresentation* för bakgrundsfärg och ram på en textruta samt gemensam textstil mellan textruta och rektangel med text.

Det är däremot **inte bevisat** att aktuell renderer, exportörer och egenskapspanel behandlar alla dessa kombinationer konsekvent. Det ska testas innan en egenskap utlovas i UI.

## 1. Modellens nivåer

1. **Objekt:** identitet, typ, synlighet/låsning, position/rotation, övergripande `style`, effekter och tillgänglighet.
2. **Behållare/utseende:** ytfyllning, ram/linje, radie, opacitet. Gäller en *visuell ram* där objektets förmåga stödjer den.
3. **Textbehållare:** textinnehåll eller `contentRef`, marginaler, justering, överflöd. Både `text` och `shape` kan innehålla text.
4. **Textinnehåll:** stycken och `runs`, med formatering på segmentnivå. Ett elementvärde får inte oavsiktligt radera segmentformat.
5. **Arv/bindningar:** `styleRef`, tema, layout-platshållare och overrides via `effective()`. UI måste skilja mellan ärvt och lokalt värde.
6. **Specialiserat innehåll:** bildkälla/beskärning, tabellceller, dataset, diagram, ekvationer m.m.

**Viktig semantik:** `style.color` är textfärg och `style.fill` objektets ytfyllning. `style.stroke`/`strokeWidth` är objektets kontur, inte textens färg. Namn och grupperingar i UI måste göra den skillnaden tydlig.

## 2. Föreslagen förmågematris

Kod: **G** = gemensam förmåga efter adapter-/renderertest, **S** = specifik/typberoende, **–** = inte relevant, **?** = undersök stöd och semantik före aktivering. Tabellen är en *målmodell*, inte en deklaration om aktuellt fullständigt stöd.

| Egenskaper / objekttyp | Text | Form med text | Bild | Linje/pil | Tabell | Diagram |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| Position/storlek/rotation | G | G | G | G | G | G |
| Lås/synlighet/opacitet | G | G | G | G | G | G |
| Ytfyllning / bakgrund | G | G | – | – | S | S |
| Ram/kontur, färg och bredd | G | G | ? | G | S | S |
| Typografi (grundstil) | G | G | – | – | S | S |
| Rik text (stycken/runs) | G | G | – | – | S | S |
| Textplacering och marginaler | G | G | – | – | S | S |
| Bildbeskärning/passning | – | – | S | – | – | – |
| Formgeometri/radie | – | S | – | – | – | – |
| Tabellcellernas format | – | – | – | – | S | – |
| Dataserie/axlar/legend | – | – | – | – | – | S |
| Alt-text/interaktioner | G | G | G | G | G | G |

För `icon`, `callout`, `group`, `component`, `semanticDiagram`, `equation`, `vectorPath`, `inkStroke`, `media`, `link`, `process`, `timeline`, `orgChart`, `model3D`, `embeddedObject`, `codeBlock`, `map` och `connector`: inventera en motsvarande adapter innan generella kontroller exponeras. Att en egenskap är tillåten av JSON Schema betyder inte att dess visualisering är implementerad.

## 3. Identifierade gap i den aktuella redigeraren

| Gap | Belägg | Rekommenderad åtgärd |
| --- | --- | --- |
| Textobjekt får inte ett uttalat bakgrunds-/ramflöde | `EditorApp.tsx` visar generiskt `Fyllning`, men saknar motsvarande ram-/linjebreddskontroller för text | Samlad sektion **Yta och ram** för text/shape, med på/av, färg, tjocklek och helst transparens |
| Gemensam textstil för shape + text | `RichEditor` finns för båda; gemensam flera-objekt-redigering erbjuder bara gruppera/komponent/ta bort | Adapter för `textStyle` med blandade värden och en atomär multi-patch |
| Fyllningens betydelse är otydlig | En enda generisk Fyllning-kontroll visas även för andra objekt | Filtrera efter **förmåga**, inte bara `type` eller förekomst av `style` |
| Arv och lokal överstyrning | `effective()` sammanför tema/styleRef/platshållaroverride | Visa 'Ärvt' och 'Återställ' separat från uttrycklig lokal överstyrning |
| Rik text har flera formatnivåer | `style`, `paragraphStyle`, `richRun` | Definiera precedence vid multi-edit och bevara inline runs där användaren inte bett om deras formatering |
| Typberoende specialegenskaper i stor panel | Direkt villkorad JSX per `element.type` | Separera egenskapsdefinitioner/adaptrar från UI |
| Typbyte för befintlig form | UI har gjorts skrivskyddat | Bevara `shapeType` i PPD; ingen normativ formatspärr på typbyte behövs just nu |

## 4. Modell för gemensam egenskapsredigering

Föreslagen arkitektur (redigerar-/domänlager, **inte** ny PPD-syntax):

```ts
type Applicability = 'all' | 'some' | 'none';
type Aggregate<T> =
  | {kind:'uniform'; value:T}
  | {kind:'mixed'}
  | {kind:'unset'}
  | {kind:'unsupported'};
interface PropertyAdapter<T> {
  id: string;
  group: 'layout' | 'surface' | 'text' | 'effects' | 'advanced';
  supports(element: ElementContext): boolean;
  read(context: ElementContext): T | undefined;
  patch(context: ElementContext, value: T): ElementPatch;
}
```

För markerade `text` + `shape` med text returneras `text.fontSize` som `mixed` om värdena skiljer sig. En användarändring skriver till båda genom **en** transaktion i `EditorStore`, med en undo-enhet. Ändringen bör inte ersätta `text.paragraphs` eller deras `runs` om det är den generella textstilen som ändras.

Regler för flera markeringar:
- Grundläge: visa och aktivera egenskaper som **alla** markerade objekt stödjer.
- `mixed` visas som `Blandade värden`, inte som första objektets värde.
- `unset` är inte samma sak som noll eller vit/transparent färg.
- Partiellt stöd visas endast i ett uttryckligt separat läge med antal berörda objekt och tydligt samtycke.
- Låsta/skrivskyddade objekt får inte tyst redigeras; kommunicera avvisning/uteslutning och håll transaktionen atomär.
- Bevara identitet, referenser, layoutbindning och textens stycke-/segmentstruktur.

## 5. Bakgrund och ram på textfält – prioriterat användarfall

**Mål:** Markera textruta, välj **Yta och ram**, aktivera bakgrundsfärg samt ramens färg och tjocklek. Skilj detta från textfärg. Samma grundkontroller ska fungera på rektangel med text.

Testa följande innan UI-aktivering:
1. Schema-giltigt textobjekt med `style.fill`, `style.stroke` och `style.strokeWidth`.
2. Browserrendering: textrutans yta, ram, text, transparens och padding i ljus/mörk bakgrund.
3. Roundtrip: skapa → spara → öppna igen utan dataförlust.
4. PDF/PPTX/HTML-export: kontrollera om ram/fyllning finns med; dokumentera eventuella fallback och redigerbarhet.
5. Gemensam ändring på textruta och form med blandade värden, med undo/redo och bibehållna rich-text-runs.
6. Master, `styleRef` och platshållarbundna objekt: ärvd stil kontra lokal override.

**Formatbedömning:** Ingen identifierad schemaändring behövs för enkla textbakgrunder och ramar. En framtida *separat* fråga är om vi behöver uttryckligare textbehållarsemantik för fler typer, avancerad linjestil, individuella kanter eller olika arvstrategier.

## 6. PPD-format: behåll, utred eller ändra?

| Kandidat | Beslut nu | Motivering |
| --- | --- | --- |
| `style.fill` på `text` | Behåll | Redan möjligt via gemensamt style-schema |
| `style.stroke`/`strokeWidth` på `text` | Behåll | Redan möjligt |
| `text`/`contentRef` på `shape` | Behåll | Redan representerat |
| Flerobjekts-redigeringsstatus (mixed/partial) | **Endast runtime** | UI-tillstånd, inte presentationens innehåll |
| Formtyp oföränderlig i vanlig egenskapspanel | **Endast UI-policy** | `shapeType` krävs fortfarande i filer |
| Textbehållare som förmåga | Börja med adapter i runtime | Ändra format först om ett verifierat representeringsgap hittas |
| Mer avancerade konturstilar/kanter | Utred separat | Kräver konkret interop-/renderingsbehov och kompatibilitetsplan |
| Eventuell ny schema-version | **Ingen nu** | Kräver referensfixtur, migrering, exportstöd och beslutad bakåtkompatibilitet |

## 7. Föreslagen implementeringsordning

1. **PPD-002 – förmågekontrakt och fixture-tester** för `text` + `shape` med text, yta, ram och tema-arv. Kartlägg faktiskt stöd i renderer/PDF/PPTX innan produktionsexponering.
2. **UX-005 – egenskapsregister** och grupperade sektioner (Innehåll, Text, Yta och ram, Placering, Effekter, Avancerat), med enstaka objekts redigering.
3. **UX-006 – gemensamma ändringar** av typografi, yta och ram på blandade objekt; atomär transaktion, mixed/unset och låsta objekt.
4. **PPD-003 – separat formatbeslut endast vid visad lucka**, med schema-versionering, migration och testkorpus.

## 8. Begränsningar

Detta är en statisk inventering av schema, modell och redigerarkod. Analysen verifierar **inte** hur varje objekt renderas i WebKit eller hur varje fält roundtrippas till PowerPoint/PDF. Dessa ska vara explicita acceptanskriterier, inte underförstådda antaganden. `docs/release-review.md` och manuella releasegrindar gäller fortsatt.
