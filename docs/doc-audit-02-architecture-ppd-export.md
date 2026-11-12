# DOC-AUDIT-02 – arkitektur, PPD och export mot faktisk kod

**Källavstämning:** 2026-11-12, `main` `fc74c52d9b4d6c79b177ab912cefac5e803efec7` före dokumentationsändringarna. Detta är en **avgränsad kod- och dokumentjämförelse**, inte manuell acceptans i Office eller Safari.

## Verifierade fynd och rättningar

| Område | Dokumentation före granskningen | Kodbelägg | Rättning |
| --- | --- | --- | --- |
| Arkitekturstatus | `docs/architecture.md` beskrev motorer som kandidater och appen som en planerad lösning | `src/core/model.ts`, `src/core/editor.ts`, `src/editor/Renderer.tsx`, `src/export/pdfWriter.ts`, `src/export/pptxWriter.ts` | Ersatt målarkitekturtext som aktuell beskrivning med implementerad modulöversikt. Den historiska målbilden finns kvar som bakgrund. |
| IndexedDB | Arkitekturen talade om versionshanterade databasmigreringar och separat Blob-lagring som om det var genomfört | `src/core/persistence.ts` använder databasversion 1, `drafts`-store och sparar kompletta klonade dokument; `src/core/persistenceController.ts` debouncerar och versionskontrollerar | Förklarat exakt lagring och att framtida databasmigrationer fortfarande är utvecklingsbehov. |
| PPD-versioner | Ett långt äldre 0.3.1-kontrakt pekade ut sökvägen till det numera aktiva 0.4-schemat som ett 0.3.1-schema | `src/core/model.ts` skapar 0.4.0, `schemas/ppd.schema.json` anger 0.4.0, `schemas/ppd-0.3.1.schema.json` är den äldre versionen | Skiljt aktivt kontrakt från historiska DEV-001-formuleringar. |
| Formatimport | Äldre kontrakt kan uppfattas som generell migration/kompatibilitet mellan äldre format | `src/core/contract.ts`, `src/core/legacy.ts`, `src/core/ppd040Staging.ts` | Dokumenterat 0.3.0 → 0.3.1, separat 0.4-staging och begränsat 0.1/0.2-stöd utan att utlova full historisk kompatibilitet. |
| Formatgranskning | `docs/format-review.md` beskrev GAP-01–12 utan framträdande märkning som historisk granskning av 0.3-underlag | `docs/ppd-contract.md`, aktiva schema- och kontraktsmoduler | Markerat dokumentet uttryckligen som historiskt underlag; behållit ursprungliga observationer. |
| Exportmotorer | `docs/export-policy.md` hade rubriken ”mål, inte verifierat stöd” trots implementerade exportvägar | `src/export/exportController.ts`, `src/export/html.tsx`, `src/export/pdfWriter.ts`, `src/export/pptxWriter.ts` | Delat upp faktiskt implementerade format och profiler från normativ målmatris. |
| Exportrapport | Måldokumentet kunde tolkas som att motorns version och särskild förlustklassning var egna fält i dagens rapport | `src/export/plan.ts`: `format`, `profile`, `sourceHash`, `objects`, `warnings`; varje objekt har `slideId`, `elementId`, `status`, `reason` | Listat faktiskt existerande rapportfält och tydliggjort vad som fortfarande är mål. |
| Visuell exporttäckning | `docs/export-coverage.json` sade att full pixeljämförelse saknas, trots att SF-QUAL-10 har ett diagnostiskt bildparstest | `scripts/generate_export_acceptance.mjs`, `scripts/report_export_fidelity.mjs`, `tests/export-fidelity-metrics.test.mjs` | Uppdaterat EXP-03 och EXP-13; lagt till EXP-17 för faktisk referensgenerering och diagnostisk RGB-jämförelse utan att klassificera den som godkänd Office-fidelitet. |

## Skillnader mellan implementation och acceptans

**Implementerat** betyder att motsvarande programkod finns. **Automatiskt verifierat** betyder en specificerad testad delmängd. **Godkänt för release** kräver dessutom de manuella grindar som är relevanta, bland annat verklig PowerPoint-redigering (RG-006) och oberoende PDF-läsare (RG-008). En diagnostisk fullbildsjämförelse med tröskel på färgkanaler är inte automatiskt en beslutad kvalitetstolerans.

PPD 0.4.0 är aktivt schema och format för nya presentationer, men en godkänd strukturell modell bevisar inte redigerings-, rendering- eller exportstöd för varje möjligt schemafält. Begränsade äldre profiler förblir just begränsade.

Arbetskopior i IndexedDB saknar serversynk; en HTML-fil är den portabla säkerhetskopian. Säkra uppdateringar av PWA och appcache måste inte förväxlas med långtidsbevarande av lokala användardokument.

## Avstämda dokument

- [Implementerad arkitektur](architecture.md)
- [Aktivt PPD-kontrakt och historiskt 0.3.1-underlag](ppd-contract.md)
- [Historisk formatgranskning](format-review.md)
- [Implementerad export och normativa exportmål](export-policy.md)
- [Maskinläsbar exporttäckning](export-coverage.json)

## Återstår till efterföljande dokumentgranskningar

**DOC-AUDIT-03:** Verifiera användarfunktionspåståenden, responsiva UX-beskrivningar, releasegrindarnas evidens och funktionell kravtäckning mot nuvarande UI och tester.

**DOC-AUDIT-04:** Inventera historiska steg- och utvecklingsrapporter, kontrollera interna dokumentlänkar över hela trädet och märk äldre statusuppgifter som historik där det behövs.

Denna granskning ändrar **inte** releasebedömningen `NOT_READY` eller några manuella releasegrindar.
