# Slide Fable – aktuell projektstatus

**Avstämd:** 2026-11-08 efter merge av PR #120. **Källrevision:** `main` `9e0ed268dfce72295f535e480ea964a2275f19a5`. **Releasebedömning:** `NOT_READY` (full MVP/produktion är inte accepterad).

## Nuvarande läge

- **Implementerat:** Presentationer redigeras med PPD 0.4.0, inklusive redigeringsverktyg för tabellceller, diagram, bildersättning, paneler och PDF-/PPTX-/HTML-export inom dokumenterade stödområden. Se [användarguiden](docs/user-guide.md) och [implementerad funktionsprofil](docs/functional-specification.md).
- **Senast mergade steg:** SF-NEXT-07a–09 genom [PR #118](https://github.com/erland/slide-fable/pull/118); DOC-FIX-01 genom [PR #119](https://github.com/erland/slide-fable/pull/119); DOC-FIX-02 genom [PR #120](https://github.com/erland/slide-fable/pull/120).
- **Verifierad CI-evidens:** PR #120:s `Verify Slide Fable candidate` [körning 42477284467](https://github.com/erland/slide-fable/actions/runs/42477284467) avslutades med **success** för PR-HEAD `cff69fa0889c9d6b99fe62db978040d02429930d`. Även kandidatverifiering på föregående `main` `e8dab85` [körning 42477107458](https://github.com/erland/slide-fable/actions/runs/42477107458) passerade. Detta är **inte** verifiering av hela den manuella releaseacceptansen.
- **Senaste `main`:** [kandidatverifiering 42478775686](https://github.com/erland/slide-fable/actions/runs/42478775686) var **pågående vid avstämningen**, medan [Pages-deploy 42478775696](https://github.com/erland/slide-fable/actions/runs/42478775696) har avslutats med **failure**. Kandidatverifieringen måste fortfarande få ett slutresultat för just denna revision.
- **Driftsättning:** Pages-deploy på aktuell `main` har **failure** och även äldre körningar har misslyckats, exempelvis [42477107473](https://github.com/erland/slide-fable/actions/runs/42477107473). Orsak är **inte fastställd i denna dokumentationsgranskning**. Grön kandidat-CI bevisar inte lyckad driftsättning.

## Återstående releasegrindar

- RG-001–RG-004: automatiska kandidatgrindar måste bedömas från komplett evidens på aktuell commit; tidigare lyckade CI-körningar får inte utan granskning överföras till ny revision.
- RG-005: fysisk iPad/iPhone/Safari, installation, touch och offline.
- RG-006: PowerPoint Mac/Windows, öppna, redigera och spara om.
- RG-007: manuell tillgänglighet och visuell jämförelse.
- RG-008: oberoende PDF-läsare och svensk text.
- RG-009: **BLOCKED** – autentiska historiska PPD 0.1/0.2-filer och kontrakt saknas.
- RG-010: resterande full AT-acceptans.

**Nästa rekommenderade handling:** utred Pages-deployens fel om det kvarstår och kontrollera de senaste `main`-körningarna; därefter fortsätt med releaseacceptans enligt [releasegranskningen](docs/release-review.md). Den ursprungliga DEV-004–015-planens blockerade acceptanskriterier ligger kvar separat och ska inte misstas för att all funktionalitet saknas. [Fortsättningsplan](docs/continuation-plan.md) och [maskinläsbar arbetsstatus](.system-builder/work-status.yaml).

## Historik

Tidigare statusnoteringar finns i Git-historiken, [fortsättningsplanen](docs/continuation-plan.md) och stegens verifieringsrapporter under `docs/`. De beskriver läget vid respektive tidpunkt, inte aktuella nästa steg.
