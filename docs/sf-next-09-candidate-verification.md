# SF-NEXT-09 – kandidatverifiering och releasebedömning

Datum: 2026-11-08. **Steg: PARTIAL / EXTERNAL CI REQUIRED. Release: NOT_READY.**

## Ändring

`scripts/verify_release_candidate.py` publicerar nu ett maskinläsbart JSON-bevis efter varje slutfört delprov och vid fel. Varje bevis visar exakt namngivna PASS/FAIL, saknade krav (PENDING), felande kommando, returkod och begränsat loggutdrag. Filen ersätts atomärt. Därmed blir GitHub Actions-artefakten användbar även när ett sent kandidatprov misslyckas. Test `test_failed_candidate_check_writes_pending_failure_evidence` använder en avsiktligt felande npm-kommando och verifierar att RG-001 blir FAIL, RG-002 PENDING och release NOT_READY.

## Genomförda verifieringar (denna leverans)

- Python: `python -m unittest tests/test_release_gates.py` **10/10 PASS**; verifiering av fallerande delprov och korrekt JSON-rapport ingår.
- Python: `python scripts/verify_planning.py` **PASS** (391 struktur- och hygienkontroller före slutpaketering).
- `python -m py_compile scripts/verify_release_candidate.py` **PASS**.
- Node 22/Chromium: se Agent Workspace-loggar för exakt genomförda checks; scope begränsat till körda Node-tester och build, inte till komplett Python-kandidatsvit.

## Fel upptäckt under den fullständiga Node-körningen

En sammanhängande `npm test` i Agent Workspace passerade majoriteten av kontrollstegen men slog sporadiskt fel på `panel-workflow ipad-portrait`: testet väntade enbart på att befintlig bilds `data:image/png`-källa fanns, inte på att bildens `assetRef` hade ändrats efter ersättning. `tests/panel-workflow-browser.mjs` väntar nu på **nytt assetRef för samma ID** före assert; detta är en korrigering av testets asynkrona väntvillkor och inte en funktionsändring. Två efterföljande Agent Workspace-körningar visar fortfarande intermittent bildersättnings-/testtillstånd: en körning föll i iPad med ett saknat bildobjekt vid snapshot, nästa i mobil med oförändrat `assetRef` trots att väntvillkoret såg en ändring. **BLOCKERANDE regression i SF-NEXT-09** tills flödet reproducerats, diagnostiserats och passerat på nytt. Inget automatiskt PASS på denna senaste revision intygas.

## Blockerare för samlad kandidat-PASS

1. Den lokala Python-miljön saknar låsta `rfc8785==0.1.4`, och paketindex kan inte nås (DNS). Full `python -m unittest discover -s tests -v` har **inte PASS** (ImportError). Nio tidigare releasegrindtester passerade, därefter utökade till tio.
2. Agent Workspace Node 22/Chromium har inte kommandot `python`, trots att npm och browser-testkörningar fungerar; Python-kontraktsviten kan därför inte köras där.
3. `python scripts/verify_release_candidate.py` kräver både komplett Python-miljö och browser-/npm-miljö i samma exekvering. Någon fullständig sammanhängande körning för **denna källrevision** har därför inte godkänts.
4. Den kompletta `npm test`-körningen nådde bildersättningstestet och föll på iPad portrait; riktade omkörningar föll på iPad respektive mobil. Orsaken är ännu inte verifierat löst.
5. Ett grönt projektbygge utgör inte bevis för GitHub Actions på denna ZIP-revision. GitHub-flödet `verify.yml` är konfigurerat med Python 3.12 och låsta pip-krav och kan användas som korrekt miljö efter incheckning. Den externa CI-körningen är ej utförd för denna ZIP.

## Grindar

- **RG-001–RG-004:** PENDING samlat kandidatbevis på denna version; tidigare avgränsade browser-, PWA- och exporttester var PASS i SF-NEXT-08.
- **RG-005:** PENDING – riktig iPad/iPhone/Safari, installation och offlineomstart.
- **RG-006:** PENDING – redigera, spara, återöppna i PowerPoint Mac/Windows.
- **RG-007:** PENDING – manuell tillgänglighet, tangentbord/skärmläsare och visuell acceptans.
- **RG-008:** PENDING – riktig oberoende PDF-läsare och svenska tecken.
- **RG-009:** BLOCKED – autentiska historiska PPD 0.1/0.2-filer/schema saknas.
- **RG-010:** PENDING – full AT-201–218 och AT-301–310-acceptans.

## Nästa konkreta åtgärd

Checka in denna version i en PR och kör `Verify Slide Fable candidate` på GitHub Actions där både Node 22, Python 3.12, låsta pip-beroenden och Chromium/Poppler är tillgängliga. Ladda ned `slide-fable-visual-evidence` och granska `slide-fable-release-evidence.json`: inga RG-001–004 får deklareras PASS utan kompletta namngivna checks. Åtgärda eventuella verkliga CI-fel, kör om, och först därefter planera manuella RG-005–010.

**Beslut:** Kandidatens automatiska slutgrindar är inte slutligt godkända ännu. SF-NEXT-09 kan inte markeras COMPLETED före full kandidatverifiering. Produktionsrelease fortsatt **NOT_READY**.
