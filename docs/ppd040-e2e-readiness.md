# PPD 0.4.0 – end-to-end-beredskap (teststeg)

## Körbara kontroller i denna PR

`tests/ppd040-e2e-readiness.test.mjs` testar kedjan:

1. skapa ett giltigt 0.4-dokument
2. öppna det i `EditorStore` och skapa former och pilar
3. ändra kanoniska konturer och verifiera deras färg, bredd, streckning och ändmarkörer
4. ångra/gör om
5. spara som JSON, läsa tillbaka och öppna den återlästa versionen i redigeringsmotorn
6. kontrollera PDF/PPTX-**preflightplanering**, samt att ogiltiga animationsreferenser inte skrivs till dokumentet.

**Viktigt:** `preflight` är en klassificering, inte en faktisk export. Dessa tester bevisar **inte** att PDF/PPTX-filer genereras korrekt eller att visuell överensstämmelse uppnås. De testar inte heller att hela webbläsargränssnittet är inkopplat för 0.4.

## Status per kedjedel

| Del | Testad automatiskt i denna PR | Behöver kompletteras före formatbyte |
| --- | --- | --- |
| Skapa PPD 0.4-dokument | Ja | Integrera i ordinarie skapa-kommando |
| Redigera med EditorStore | Ja, avgränsad sekvens | Fulla verktyg, kopiera/klistra, layouter, tabeller och komponenter |
| Giltiga konturer | Ja | Samtliga egenskaper (custom dash/caps/joins) |
| Ångra/gör om | Ja | Mer sammansatta flerstegsscenarier |
| JSON save/open | Ja, via explicit 0.4-API | Ordinarie filöppna/spara och standalone HTML |
| Webbrenderare | Nej | Playwright-skärmbilder för typfall och nytt 0.4-dokument |
| PDF | Endast preflight | Faktisk PDF-generering, parsning och bildjämförelse |
| PPTX | Endast preflight | Faktisk PPTX-generering, OOXML-kontroll, PowerPoint-paritet |
| Fullständig in/ut-formatparitet | Nej | Varje prioriterad A- och B-funktion |
| Standardformat 0.4 | Nej | Integrationsbeslut efter alla blockerande verifieringar |

## Blockerande frågor inför aktivering

- **Filgräns:** `importDocument`, `validateCore`, `createDocument` och ordinarie exportcontroller är fortfarande 0.3.1-orienterade. De får inte bytas var för sig.
- **Nya properties:** schemat har `outline`, `flipX/Y`, tableLayout, chartFormatting, animation. Att fälten valideras är inte likvärdigt med komplett användarstöd.
- **Konturer:** exportörernas vanliga former/linjer använder gemensam läsning men stödet för avancerade ändmarkörer och övriga konturinställningar behöver en egen exporttestsvit.
- **Filer:** JSON-roundtrip utan förlust är nödvändigt men inte tillräckligt. Kontrollera att aktivt UI läser/sparar utan att nedgradera dokumentet.
- **Visuell paritet:** verifiera text med fyllning/ram, fri form, linje med ändmarkörer, tabell och diagram i browser/PDF/PPTX.

## Nästa föreslagna genomförande

**Export-040:** bygg riktiga exportartefakter från explicit PPD 0.4-dokument i en testmiljö, och kontrollera PDF och PPTX programmatiskt; jämför visuellt utvalda objekt med browser-renderingen. Separat PR för import/export-aktivering därefter.

Denna PR är avsiktligt en **integrationsregression och ärlig statusrapport**, inte ett påstående om fullständig end-to-end-export. PPD 0.3.1 förblir aktivt.
