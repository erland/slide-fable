# SF-NEXT-08 – Releasegrindar och verifierbara belägg

Datum: 2026-11-08. **Stegstatus: AUTOMATED SUBSET VERIFIED / RELEASE NOT_READY.**

## Åtgärd

Tidigare kunde `RG-001` felaktigt bli PASS av enbart `lint`, trots att grinden också kräver kontraktsprov och planeringshygien. Releasegrindarna kräver nu **samtliga explicit namngivna delkontroller**; ett FAIL väger tyngst och saknade belägg ger PENDING. Upprepade/ogiltiga bevis avvisas. Ingen status PASS lagras i källprofilen.

`verify_release_candidate.py` kan skriva ett maskinläsbart resultat till `RELEASE_EVIDENCE_OUTPUT`, först när dess verkliga kontrollkedja avslutats. GitHub Actions arkiverar denna fil vid en lyckad verifiering (och kan visa eventuellt delresultat efter fel). Beläggen omfattar särskilda namngivna checks, inte enbart den sammanfattande jobbsymbolen. Den ursprungliga fullständiga acceptansmatrisen och `NOT_READY` bibehålls.

## Releasegrindar

| Grind | Status för release | Kvar för attest |
|---|---|---|
| RG-001 Kodkvalitet | PENDING, till CI:s kompletta sammanställda körning | Fullständigt Python-kontrakt (lokalt saknas `rfc8785`), slutligt CI-bevis med alla fyra checks |
| RG-002 Dokumentlivscykel | Automatiska delprov PASS | Samlad evidensfil från kandidatverifieringen |
| RG-003 Redigerare/export | Automatiska delprov PASS | Samlad evidensfil samt manuell Office/PDF-acceptans enligt RG-006/008 |
| RG-004 PWA/offline | Automatiska delprov PASS | Samlad evidensfil; fysisk iOS hanteras separat i RG-005 |
| RG-005 Safari på fysiska enheter | PENDING | iPhone och iPad: installera, stäng/öppna offline, storage eviction, touch, export |
| RG-006 PowerPoint Mac/Windows | PENDING | Öppna, redigera, spara och återöppna PPTX i båda miljöer; kontrollera native objekt |
| RG-007 Tillgänglighet och visuell likhet | PENDING | Skärmläsare, tangentbord, kontrast och referensbilder |
| RG-008 Oberoende PDF-läsare | PENDING | Sidor, svenska tecken, sökbarhet och layout i oberoende PDF-läsare |
| RG-009 Historisk PPD 0.1/0.2 | BLOCKED | Faktiska äldre källfiler samt historiska scheman och full migrationstestmatris |
| RG-010 Full acceptansmatris | PENDING | AT-201–218 och AT-301–310; varje öppet delkrav enligt `docs/release-review.md` |

## Verifierat på denna kodversion

- **Agent Workspace Node 22 + Playwright 1.62.1 / Chromium 151**: `npm ci`, lint, Node-enhetstest, dokumentlivscykel, PWA/offline, full browser-redigerare, TypeScript och produktionsbygge PASS. Logg `art_3b5d1742-d51b-40e5-8ec3-c5007096aed8`.
- **Separat Agent Workspace Node 22/Chromium**: vanliga arbetsflöden, text-PDF/PPTX-paritet, avancerad tabell/diagram-export, data-export samt produktionsbygge PASS. Logg `art_43098f9c-8132-487e-8427-bbdc1b815f06`.
- **Python:** `tests/test_release_gates.py` 9/9 PASS, källans planerings-/hygienkontroller PASS. Komplett Python-suite ej utförd: `rfc8785` saknas i lokal miljö och kunde inte laddas ned. Detta är en *uppskjuten kontroll*, inte PASS.
- Test-arkiven hade temporärt ändrat enbart `package.json` `scripts.test` till avgränsade körningar för att undvika tidsgräns. Applikations- och testkoden och låsta beroenden var identiska med denna leverans. Slutlig ZIP använder oförändrat ordinarie `scripts.test`.

## Återstående acceptansprotokoll

1. **iOS/iPadOS:** protokollför maskin/OS/Safari-version, installation, flygplansläge, omstart efter appstängning, touch-redigering, offline-PDF och lagringsbrist. Bevara bild-/videobevis och förväntat/observerat utfall.
2. **PowerPoint:** provöppna på Mac respektive Windows, ändra text, tabell och native diagram; spara, stäng och återöppna; jämför modelldata och visuell fidelity och notera font-substitution.
3. **PDF och tillgänglighet:** oberoende läsare, svenska ÅÄÖ och textmarkering, tangentbordsnavigering, skärmläsarflöde, reducerad rörelse och visuell referensmatris.
4. **Historisk migration:** skaffa verkliga 0.1/0.2-källfiler/schema innan RG-009 kan prövas; syntetiska delprofiler räcker inte.

**Beslut:** SF-NEXT-08:s avgränsade förbättring av release-evidens kan avslutas, men **release är NOT_READY**. Ingen manuell acceptans eller full ursprunglig DEV-acceptans intygas av denna leverans.
