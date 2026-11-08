> **2026-11-08 – SF-NEXT-09 PARTIAL (release NOT_READY):** CI-/kandidatrapportering ger nu även vid FAIL en spårbar, atomär JSON med rätt PASS/FAIL/PENDING-status. Nya releasegrindtester 10/10 PASS. Test för asynkron bildersättning skärpt, men fortsatt intermittent FAIL på iPad/mobil i Agent Workspace; kräver reparation och ny verifiering. Samlad Python-/browser-kandidat-PASS ej möjlig i befintliga miljöer (låst `rfc8785` kan ej laddas lokalt; Agent Workspace saknar Python). Återstår: kör `.github/workflows/verify.yml` på PR och verifiera komplett evidens. Se `docs/sf-next-09-candidate-verification.md`.

> **Aktuell avstämning 2026-11-08 (SF-NEXT-08):** Release-evidensens automatik och koppling till CI uppstramade; avgränsade Agent Workspace-körningar PASS, Python releasegrindtester 9/9 PASS, full Python-kontraktssvit uppskjuten på grund av otillgängligt `rfc8785`. **Release NOT_READY.** Se `docs/sf-next-08-release-evidence.md`. Äldre statusnoteringar nedan är historiska.

> **Aktuell status 2026-11-08 – SF-NEXT-07b COMPLETED (automatiserat PASS):** Sammanhängande markering→egenskapspanel→redigera→panelbyte→bildersättning verifierat i desktop, iPad portrait och mobil. Korrigerat paneltillstånd vid öppna/stäng. ESLint, 180/180 enhetstester, uppdelad full browserregression samt TypeScript/Vite-produktionsbygge PASS i Agent Workspace Node 22/Chromium. **Nästa steg: SF-NEXT-08 (releasegrindar)**. Release fortsatt **NOT_READY** (fysisk Safari/Office/historisk migrering återstår). Se `docs/sf-next-07b-verification.md`.

> **Aktuell status 2026-11-08 – SF-NEXT-07a COMPLETED (automatiserat PASS):** Funktionen **Dela cell** är färdigimplementerad och verifierad i Agent Workspace Node 22/Chromium på desktop, stående iPad och mobil. ESLint PASS, 180/180 enhetstester PASS, alla browserregressionsgrupper PASS, TypeScript och produktionsbygge PASS. För att undvika exekveringsmiljöns tidsgräns kördes originalets fullständiga `test:raw` i tre verifierade delgrupper (endast `scripts.test` ändrades i temporära verifieringsarkiv, inte i leveransen). **Nästa fortsättningssteg SF-NEXT-07b.** Release fortsatt **NOT_READY**; fysisk Safari/Office-acceptans saknas. Se `docs/sf-next-07a-verification.md`.

> **SF-NEXT-07a (2026-11-08):** Kommando **Dela cell** implementerat för horisontellt sammanslagna tabellceller. Enhetstester 3/3 PASS; TypeScript/Vite-bygge PASS i Agent Workspace; full lint/browser-test ej verifierade (testströmning avbröts). **Implementation levererad men verifiering återstår**; se `docs/sf-next-07a-verification.md`. Nästa åtgärd: kör komplett verifiering/REPAIR innan SF-NEXT-07b. Release fortsatt **NOT_READY**.

> **Senaste avstämning 2026-11-08 (SF-NEXT-06):** Samlad statisk UX-/funktions- och releasegranskning klar. Nästa rekommenderade utvecklingssteg är SF-NEXT-07a (dela sammanslagen tabellcell utan JSON). Läs `docs/sf-next-06-ux-release-review.md`. **Release är fortsatt NOT_READY.** Äldre ”senaste steg”-noteringar nedan är kronologisk historik, inte aktuell prioritet.

# Slide Fable – aktuell status

**Avstämd:** 2026-11-08. Källbas: bifogad ZIP och GitHubs `main` (`b109873`, 2026-11-06).

**Senaste GitHub-verifiering:** [körning 42291779345](https://github.com/erland/slide-fable/actions/runs/42291779345) – `success` för senaste `main`. Inga öppna PR vid avstämningen. Dessa uppgifter gäller GitHub-observationen vid inventeringen, inte en ny lokal fullständig testkörning.

**Leveransstatus:** Applikationsversion 0.5.0; **NOT_READY** för fullständig MVP/produktion enligt `docs/release-review.md`. Det finns många senare förbättringar utöver den äldre DEV-001–015-planen; grön CI stänger inte automatiskt gamla acceptanskrav.

**Senaste fortsättningssteg:** `SF-NEXT-02` – statisk, arbetsflödesbaserad UX-granskning dokumenterad i `docs/ux-review-sf-next-02.md`; ingen faktisk browser-/iPad-acceptans gjord.

**Nästa rekommenderade arbete:** `SF-NEXT-03` – börja med UX-02-01: öppna dold egenskapspanel från animationskommandot och lägg till responsiva regressionstester. Ursprungliga DEV-004 är fortfarande första ej fullaccepterade steg och ska hanteras före full MVP-release.

- [Nuläge och spårbar evidens](docs/current-state-2026-11-08.md)
- [Fortsättningsplan](docs/continuation-plan.md)
- [Ursprunglig utvecklingsplan](docs/development-plan.md)
- [Öppna releasegrindar](docs/release-review.md)
- [Maskinläsbar historisk arbetsstatus](.system-builder/work-status.yaml)

Den äldre Kodförbättraren-planen i `.kodforbattraren/` är historiskt underlag, inte det här projektets aktuella prioriteringslista.

## SF-NEXT-03 (2026-11-08)

Panelöppningsfix och regressionstest tillagda. **Ej färdigverifierat**: lokal bygg/test blockeras av ofullständig installation av npm-beroenden. Se `docs/sf-next-03-verification.md`. Release-status fortsatt NOT_READY.

## Verifieringsuppdatering och SF-NEXT-04a (2026-11-08)

SF-NEXT-03 verifierades därefter med Agent Workspace (`npm ci`, Chromium-installation, `npm test`, produktionsbygge: PASS). Den tidigare noteringen »Ej färdigverifierat« ovan är historisk och ersätts av denna senare verifiering. Full Safari/iPad-acceptans återstår.

SF-NEXT-04a avser korrigering och regressionstest av negativa dimensioner på kopplingar i semantiska diagram vid PPTX-export. Det är en avgränsad del av den större exportparitetsplanen; releasebedömningen kvarstår `NOT_READY`.

## SF-NEXT-04c – slutlig exportparitetskontroll (2026-11-08)

Verifierat att PPTX faktiskt innehåller inbäddad bild. Ett tidigare testfel orsakades av felaktigt sätt att söka media i ZIP-arkivet, inte ett produktionsfel. Testet följer nu OOXML-relationer och validerar mediafilernas signatur. Rotation, bildgeometri och PDF-färgtest passerar i Agent Workspace. Release fortsatt NOT_READY.


## SF-NEXT-04d (2026-11-08)

Utökat det automatiska paritetstestet med en tabell och ett stapeldiagram. Testet validerar canvas/PPD-koordinater, redigerbar OOXML-struktur och data i PPTX samt synlighet i rasteriserad PDF. Fullständigt `npm test` och `npm run build` PASS i Agent Workspace Node 22 / Chromium Headless Shell. Release kvarstår som NOT_READY tills tidigare acceptanskrav och Office/Safari-verifiering uppfyllts. Se `docs/sf-next-04d-verification.md`.

## SF-NEXT-04e (2026-11-08)

Automatiskt exportparitetstest tillagt för färgsatt/sammanslagen tabell och redigerbara linje-/cirkeldiagram. Fullständigt `npm test` och `npm run build` PASS i Agent Workspace Node 22 / Chromium Headless Shell. Release fortsatt `NOT_READY`; verklig PowerPoint- och Safari/iPad-acceptans saknas. Se `docs/sf-next-04e-verification.md`.


SF-NEXT-05a (2026-11-08): Lokalt autosparande synliggjort i dokumentrubrik och separerad från HTML-nedladdning. npm test + produktionsbygge PASS i Agent Workspace Node 22/Chromium Headless Shell. Releasegrindarna är fortsatt öppna.

## SF-NEXT-05c – 2026-11-08

Möjlighet att ta bort kategori och serie direkt i diagramredigeraren, med synkroniserade värden och Ångra. Den nya browserregressionen samt resterande testsvit verifierades som två separata grupper i Agent Workspace med PASS för båda grupperna och produktionsbygget. Releasegrindar är fortfarande öppna. Se `docs/sf-next-05c-verification.md`.

## SF-NEXT-05d – 2026-11-08

Diagramredigeraren har fått knappar för att flytta serier och kategorier; kategoriflytt håller värdevektorerna synkroniserade. Riktade browserregressioner och resterande tester PASS i separata Agent Workspace-körningar; produktionsbygge PASS i båda. Se `docs/sf-next-05d-verification.md`. Release är fortsatt `NOT_READY`.
