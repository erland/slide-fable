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
