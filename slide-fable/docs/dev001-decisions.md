# DEV-001 – beslut för formatfrågorna

Samtliga tolv frågor har nu ett uttryckligt beslut. "Löst" här betyder att
kontraktsfrågan är avgjord; det betyder inte att framtida browserstöd är implementerat.

| Fråga | Beslut | Evidens i denna leverans |
|---|---|---|
| GAP-01 | geometry/assetRef och schemaets rich runs är canonical; inga gissade historiska alias | Alias- och bevarandetest, migrationstabell |
| GAP-02 | Lika alias kollapsas; olika värden blockerar | Identical aliases och geometry conflict |
| GAP-03 | name och connector införs uttryckligen i 0.3.1 | Schemat och giltig/bruten connector-fixture |
| GAP-04 | bar/line/pie redigeringsprofil; kända avancerade typer i läsläge | known-chart-outside-profile |
| GAP-05 | Okänd frivillig typ ger bevarat original/läsläge; ingen destruktiv spara/export | unknown-optional-object, källan oförändrad |
| GAP-06 | Format/payload matchas i schema; säker path-parser bevisas separat i DEV-002 | vector-format-payload-mismatch och SVG-felfall |
| GAP-07 | Namnrymder och referensregler är fastställda; referenschecker för centrala grafer | Dubblett-, referens-, grupp-, komponent- och hierarkitest |
| GAP-08 | Asset-hash gäller avkodade bytes; embedded/MIME/budget i offlineprofil | Publiceringsfixture, fel hash/MIME/extern resurs |
| GAP-09 | Strukturell core skiljs från publiceringsprofil | Minimal originalfil samt publiceringsmetadata-felfall |
| GAP-10 | Verifierbart schema går före illustrativa gamla exempel efter dokumenterat versionsbeslut | marks-array avvisas; originalexemplet migreras |
| GAP-11 | Endast faktisk 0.3.0-migration verifierad; 0.1/0.2 återstår som produktkrav | Äldre versioner läsläge, ingen falsk migrations-PASS |
| GAP-12 | RFC 8785 utan build, SHA-256 hex | Numeriska JCS-vektorer och hash/JSON-roundtrip |

## Kompatibilitetskonsekvens
Äldre formatstöd är ett kvarstående krav i originalmålbilden. Det har inte tagits
bort: DEV-004 måste införskaffa historiska fixtures, implementera och verifiera
0.1/0.2-stöd före full MVP. Kontraktet anger säkert beteende tills detta finns.
DEV-001 bygger referenskontroller, inte browserimportern eller faktiska exporter.
