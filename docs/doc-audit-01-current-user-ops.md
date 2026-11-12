# DOC-AUDIT-01 – användar- och driftdokumentation mot kod

**Kontrolldatum:** 2026-11-12. **Kodbas:** `main` `186f95098b6eb0f9cb264b0f5050ae833a719faa`, före dokumentationsändringarna. Dokumentgranskningen är **avgränsad**: den är inte en fullständig fil-för-fil-revision av alla historiska rapporter.

## Kontrollerad källa och korrigering

| Dokument | Jämfört med | Konstaterat glapp och rättning |
| --- | --- | --- |
| `README.md` | `package.json`, `.github/workflows/deploy-pages.yml`, `.github/workflows/verify.yml` | Node 22.12 var fel (krav >=22.16.0). Pages beskrevs felaktigt som direkt push/manuell deploy med upprepad testkörning. Uppdaterat till verifieringsstyrd driftsättning av exakt commit. |
| `docs/operations.md` | `package.json`, deploy/verify-workflows, `src/core/persistence.ts`, `src/ui/EditorApp.tsx` | Samma gamla Node-/Pages-beskrivning samt saknad skillnad mellan Ångra och arbetskopior. Uppdaterat. |
| `docs/user-guide.md` | `src/ui/EditorApp.tsx`, `src/core/designGallery.ts`, `src/core/persistence.ts`, `tests/lifecycle-browser.mjs`, `tests/design-gallery.test.mjs` | Saknade menyvägen Arkiv → Arbetskopior… och bekräftelsestegen. Förtydligat att Ångra inte återtar återställning. Layoutavsnittet förtydligat efter PR #152; lokal start uppdaterad för npm/Vite. |
| `STATUS.md` | GitHub `main`, PR #152–155 och GitHub Actions | Dokumentet angav PR #120 och gamla Pages-fel som aktuell status. Avstämt med senaste kända verifierade `main`: Verify #43158622009 och Pages #43159119265, båda `success`. Stale åtgärdsråd ersatt. |
| `docs/release-review.md` | `STATUS.md`, aktuella GitHub-körningar | Inledningens felaktigt aktuella 2026-11-08-körningar markerade som **historiskt statusögonblick**. Ingen releasegrind har ändrats. |
| `docs/verification-strategy.md` | `package.json`, automatiska tester, `STATUS.md` | Det gamla påståendet att appen ännu inte hade verifierade funktioner markerat som planeringshistorik och ersatt med aktuella testreferenser. |

## Granskningsprinciper

- **Körbar kod och arbetsflöden har företräde** vid beskrivning av hur appen faktiskt fungerar; normativa produktkrav behålls som mål, inte som implementeringsbevis.
- **Historiska dokument och tidigare verifieringsrapporter ska inte retrospektivt ändra sina mätresultat**. Märk deras tidssammanhang i stället.
- `NOT_READY` kvarstår tills manuella releasegrindar är dokumenterat genomförda; lyckad GitHub Actions-körning ändrar inte detta.
- Efterföljande nya commits/CI-resultat kan göra en daterad statussnapshot inaktuell. För driftsättning och tester gäller alltid resultatet på **exakt commit**.

## Förslag till fortsatt stegvis dokumentkontroll

1. **DOC-AUDIT-02 – arkitektur och format:** jämför `docs/architecture.md`, `docs/ppd-contract.md`, `docs/format-review.md`, `docs/export-policy.md` och `docs/export-coverage.json` med `src/core/`, `schemas/`, `src/export/` och aktiva tester. Separera föreslagen målarkitektur och äldre PPD-profiler från faktisk PPD 0.4.0.
2. **DOC-AUDIT-03 – funktionalitet, UI och acceptans:** gå igenom `docs/functional-specification.md`, `docs/responsive-ux.md`, `docs/release-review.md`, `docs/release-gates.json` samt automatiska webbläsartester. Klassificera varje påstående som implementerat, delvis verifierat, krav eller historiskt.
3. **DOC-AUDIT-04 – historiska etappdokument och länkar:** inventera SF- och DEV-etappdokumenten i dokumentationskatalogen, planer och referensmaterialet. Bevara historiska resultat, upptäck döda filhänvisningar, märk tydligt vad som inte beskriver senaste `main`.

**Omfattningsgräns i denna PR:** Avslutar endast DOC-AUDIT-01; punkterna 1–3 är efterföljande separata granskningar, inte påståenden om att de redan utförts.
