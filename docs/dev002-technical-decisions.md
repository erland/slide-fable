# DEV-002 – tekniska beslut och evidens

## Utfall
Teknikspiken är genomförd med lokal browser- och filverifiering. Resultatet är
passed_with_deferred för plattformsprov som kräver annan miljö. Ingen release-
eller produktacceptans ges. DEV-003 kan bygga PWA-skal utan att dessa exportdetaljer
behöver färdigställas, medan exportrelease fortsatt spärras av nedanstående kontroller.

## Bibliotek och rendering
| Område | Valt för fortsatt implementation | Faktiskt bevis / begränsning |
|---|---|---|
| Visning/layout | DOM/SVG och browsermätta textrader | Svensk text utan overflow i tre Chromium-skärmstorlekar; ingen full font-/layoutparitet ännu |
| Rik text | Tiptap 3.32.0 / ProseMirror | Paragraph/runs med bold/länk och PPD-ID överlever brygga och faktisk tangentbordsredigering; övriga format provas i DEV-008 |
| Lokal PDF | pdf-lib 1.17.1 + fontkit 1.1.1 | Offline-browsernedladdning, tre sidor 16:9, sökbar åäö och inbäddade fonter; verklig iPad återstår |
| PPTX | PptxGenJS 4.0.1 | Separata OOXML-text/form/tabell, effektbild + huvudtext; Office Mac/Windows återstår |
| SVG/MathML | DOMPurify 3.4.17 + explicita regler | Script/foreignObject/event/fjärrreferens avvisas i prov; MathML saneras; full säkerhetskorpus krävs i DEV-004 |
| LaTeX | KaTeX 0.19.0 | Trust av, expansions-/storleksgränser, externa kommandon blockerade; källa bevaras separat |
| Test/build | Playwright 1.62.1, esbuild 0.28.2 | Exakta versioner och transitive resolution i package-lock; Chromium-testbinär 153.0.8010.0 dokumenterad |

## PDF-beslut
Lokal PDF-generering väljs som bas för vidare utveckling. Browserutskrift behålls
som alternativ och valfri låst Chromium-CLI kan senare ge högre visuell fidelitet.
Ingen obligatorisk PDF-server införs. Byte av huvudväg mot tidigare arkitekturförslag
är avsiktligt och underbyggt av faktiska filer, sökbarhetskontroll och browsernedladdning.
Browserns layoutmätning är input till exporter; varje exportör ska inte själv gissa
radbrytning. Full Unicode/fontfallback, styckeformat och transformmatematik återstår.

## Effektbeslut
Effekter får bli separata rasterlager med redigerbar text ovanpå. Det bevisade
exemplet är en approximation med synlig varning och objektrapport. Generell
backdrop-komposition är ännu inte löst; visual-first får inte märkas färdig förrän
den har jämförts visuellt mot HTML. Arbetet ligger kvar i DEV-009/013/014.

## Kvarstående grindar
- DEV-003/015: faktisk Safari/iPad/iPhone-installation, offlineomstart, filhämtning,
  touch, virtuellt tangentbord och lagringsbeteende.
- DEV-008: full PPD-rik text, listor, språk/IME, fontvariation och undo-brygga.
- DEV-004/011: full SVG-path/MathML-validering och säker produktionsimport.
- DEV-013: PDF-layout över hela objektkatalogen, klippning och kontrast.
- DEV-014/015: verklig PowerPoint Mac/Windows öppnar utan reparation och kan redigera
  rubrik, formfärg och tabell; textklippning, typsnitt och effekter jämförs.

WebKit-binären gick att hämta via alternativ officiell spegel, men dess
systembibliotek saknas. Installationsförsöket stoppades av begränsningar för
processers användar-/gruppbyte i miljön. Detta är miljöbegränsad verifiering,
inte ett godkänt WebKit-test och inte ett observerat funktionsfel i appen.

## Licenser
Metadata och fulla licenstexter för medföljande bibliotek har samlats i
spikens THIRD_PARTY_NOTICES.txt och dependency-inventory.json. Produktionskandidaterna
är MIT, utom DOMPurify som erbjuder MPL-2.0 eller Apache-2.0; Apache-2.0 väljs.
DejaVu-fontfilerna följer med sin distributionslicens under fonts. Biblioteken
kräver inga externa betal-API:er. Hosting, framtida integrationer och eventuella
andra produktfontval bedöms separat; detta är ingen kostnadsprognos.
