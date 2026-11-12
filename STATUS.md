# Slide Fable – aktuell projektstatus

**Källavstämning:** 2026-11-12, `main` `186f95098b6eb0f9cb264b0f5050ae833a719faa`, före dokumentations-PR:n. **Releasebedömning:** `NOT_READY` – fullständig MVP-/produktionsacceptans är inte slutförd.

## Nuvarande läge

- **Implementerat:** PPD 0.4.0, objekt-/bild-/textredigering, layout-/temagalleri, lokal IndexedDB-arbetskopia, PWA och HTML-/PDF-/PPTX-/bildexport inom dokumenterat stödområde.
- **Senaste kodändringar:** PR [#152](https://github.com/erland/slide-fable/pull/152) återanvänder layoutstyrda textobjekt; [#153](https://github.com/erland/slide-fable/pull/153) flyttar återställning till **Arkiv → Arbetskopior…**; [#154](https://github.com/erland/slide-fable/pull/154) och [#155](https://github.com/erland/slide-fable/pull/155) ändrar presentationsskalning och uppdaterar regressionstester.
- **Senaste kontrollerade verifiering:** [Verify Slide Fable candidate #43158622009](https://github.com/erland/slide-fable/actions/runs/43158622009) avslutad med **success** för ovanstående `main`. [Pages-deploy #43159119265](https://github.com/erland/slide-fable/actions/runs/43159119265) avslutad med **success** för samma commit. Nya körningar efter denna källavstämning ska kontrolleras separat.
- **Distributionsregel:** Pages-jobbet körs endast efter lyckad kandidatverifiering på **den exakta senaste `main`-committen**; misslyckad verifiering leder inte till deploy. Se [README](README.md) och [driftguiden](docs/operations.md).
- **Aktuella användarflöden:** Se [användarguiden](docs/user-guide.md). Ångra/Gör om arbetar med ändringshistorik; lokala arbetskopior öppnas separat via Arkiv-menyn.

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
