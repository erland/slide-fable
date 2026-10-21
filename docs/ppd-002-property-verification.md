# PPD-002 – Kontrakt och verifiering av egenskaper för text och form

**Datum:** 2026-10-21 · **Status:** Test- och gapinventering, inga produktions- eller schemaändringar.

## Bevis och omfattning

- `tests/ppd-properties.test.mjs` provar att PPD accepterar både `fill`, `stroke`, `strokeWidth` och typografi för **text** och **shape**, inklusive JSON-serialisering, återläsning och `validateCore`.
- Samma fil provar att ändring av en textrutas yta/ram inte ändrar dess textinnehåll, samt att undo/redo återställer ytformat och att platshållarbundet textobjekt får effektiva stilar.
- `tests/editor-browser.mjs` mäter `elementStyle` i faktisk Chromium-miljö och karakteriserar en **känd befintlig lucka**: `shape` får bakgrund och ram, medan `text` hittills inte får dessa CSS-egenskaper.

## Samlad gapmatris

| Förmåga | PPD-schema | EditorStore/JSON | Browser CSS-renderer | PDF/PPTX |
| --- | --- | --- | --- | --- |
| Text: fyllning och ram | Tillåter | Testad roundtrip | **GAP** – `elementStyle` ignorerar `fill/stroke` för `text` | Ej verifierat |
| Form: fyllning och ram | Tillåter | Testad roundtrip | Befintlig stödväg finns och kontrolleras av test | Ej verifierat |
| Text och form: `fontSize` / `color` | Tillåter | Testad roundtrip | Gemensamt CSS-basstöd; hela rich-text-prioriteten ej verifierad | Ej verifierat |
| `contentRef` och arv | Tillåter | Effektiv textstil och bevarat innehåll kontrollerat | Särskilt renderingstest återstår | Ej verifierat |
| Gemensam flerobjektsredigering | Kräver ingen formatsyntax | Ännu inte implementerat | Inte tillämpligt förrän UX-006 | Ej verifierat |

**Konsekvens:** Tester som verifierar dagens gap ska bytas till positiva renderingstester när rendererändringen görs. Att kontrollera nuvarande begränsning är inte acceptans av dess framtida beteende.

## Föreslagen fortsättning

1. **UX-005a** – implementera textobjektens ytfyllning/ram i browserrenderaren, inför tydliga kontroller för `fill/stroke/strokeWidth` på båda typer och positiva visuella regressioner. Skilj textfärg från bakgrundsfärg.
2. **UX-005b** – granska PDF/PPTX-skrivarna med konkret fixture för textrektangel; åtgärda saknade attribut och kör interoperabilitetskontroller.
3. **UX-006** – bygg förmågebaserad multipel egenskapsredigering med blandade värden och en undo-transaktion.
4. **PPD-003** – överväg schemaändring endast när en kvarvarande egenskap inte kan representeras med nuvarande `style` och ett kompatibilitetsfall är dokumenterat.

### Begränsningar

Ingen faktisk iPad Safari-, PowerPoint- eller extern PDF-verifiering utförs av de nya kontraktstesterna. CSS-renderarens kunskap om yta/ram är inte i sig en garanti för utseende i full presentation. Inga påståenden om PDF/PPTX-paritet görs innan dessa exporter verifierats.
