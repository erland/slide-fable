# Granskning av PPD-underlaget

## Faktiskt verifierat
Bifogat JSON Schema är ett giltigt Draft 2020-12-schema och det bifogade
exemplet validerar med formatkontroller. Det bevisar struktur för just exemplet,
inte roundtrip, referensintegritet, säkerhet eller stöd för full objektkatalog.
Originalfilerna ändras inte i detta paket.

| ID | Observation i faktiska filer | Åtgärd i DEV-001 |
|---|---|---|
| GAP-01 | Äldre text använder box, geometry, assetId, assetRef och andra varierande fältnamn | Definiera en explicit normaliserings-/migrationskarta; tillåt inte tyst fältbyte |
| GAP-02 | element tillåter både geometry och box samtidigt; ingen konfliktregel | Definiera företräde eller konfliktfel och test för båda |
| GAP-03 | Prosa nämner namngivna objekt och connector; element-schemat har varken name-fält eller connector i enum | Fastställ representation och versionera varje kontraktsändring |
| GAP-04 | V0.3 säger inga nya chart-enumvärden; schemat innehåller area/scatter/combo utöver bar/line/pie | Deklarera läsar-/editorprofil; skilj tillåten struktur från faktiskt redigeringsstöd |
| GAP-05 | Okända frivilliga objekt förutsätts kunna bevaras med fallback; type har sluten enum | Profilstyrd läsare ska kunna isolera rå payload innan strikt redigeringsvalidering |
| GAP-06 | vectorPath kräver format och exakt ett av svg/pathData men matchar inte fält mot format | Lägg semantisk regel och negativa fixtures; säker path-parser krävs separat |
| GAP-07 | ID-unicitet, gruppcykler, assetRef/contentRef och hierarkikanter valideras inte av schemat | Bygg separat semantisk validator med scopingregler och felkoder |
| GAP-08 | Dokumenttext kräver tillgångsintegritet men assets kan sakna uri/hash; äldre exempel har annan hashform | Fastställ offlineprofil med avkodad bytes-hash, MIME och resursgränser |
| GAP-09 | Provenance/build är inte obligatoriska i schema; prosa beskriver full publiceringsmetadata | Inför publiceringsprofil ovanpå basschemat utan att förklara giltiga original ogiltiga |
| GAP-10 | Äldre JSON-exempel är illustrativa, t.ex. marks som array medan schema kräver objekt | Använd det bifogade validerbara exemplet som bas; skapa positiva/negativa fulla fixtures |
| GAP-11 | Ingen exekverbar migration eller gamla schemas/fixtures följer med | Stöd får bara deklareras för verifierade historiska versioner; ingen enbart versionssträngändring |
| GAP-12 | sourceModelHash finns men exakt kanonisering och självreferensundantag är inte preciserade | Definiera stabil serialisering och exkludera härledd build från källhash |

## Fastställda kontraktsbeslut i DEV-001
Ursprungliga observationer ovan är bevarade. Beslut och evidens finns i
`docs/dev001-decisions.md` och kontraktet i `docs/ppd-contract.md`.
Originalet behålls som källunderlag. Version 0.3.1 preciserar geometry i logiska
enheter med verifierad normalisering från bifogad 0.3.0. Spara ursprungspayload
vid begränsat läsläge, utan att rendera okänd kod eller skriva om den destruktivt.
PPTX-export får inte märka en platt bitmap som native-redigerbar.
Talaranteckningar ingår inte i publikvyn men kan finnas i återimporterbart original;
en rensad delningskopia ska markeras som separat export och inte skriva över arbetskopian.
