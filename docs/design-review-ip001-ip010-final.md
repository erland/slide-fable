# Slide Fable – samlad Design Review efter IP-001–IP-010

Datum: 2026-10-21. Underlag: aktuell `main`, PR-historik och versionerade verifieringsunderlag. Detta är en arkitektur- och statusgranskning, **inte** ett nytt end-to-end-acceptanstest.

## 1. Genomförande

| Steg | Status | Belägg / begränsning |
| --- | --- | --- |
| IP-001/002 – autosave, export och revisionsmarkörer | Implementerat | PR #38; CAS/dirty-regressioner och separation av exportbekräftelse från persistens |
| IP-003 – releasegrindar | Implementerat | PR #39; maskinläsbar indelning i automatiskt, manuellt och blockerat |
| IP-004 – okända slide-ID:n | Implementerat | Tidigare merge före #41; no-op och regressionstester för gränsfall |
| IP-005 – persistencecontroller | Implementerat | PR #41; debounce, kö, versionskonflikter flyttade från React |
| IP-006 – exportcontroller | Implementerat | PR #42; samordnad exportorkestrering |
| IP-007 – typade kommandogränser | Implementerat | PR #43; avgränsade typer och kommandon, utan fullständig migrering av dynamisk modell |
| IP-008 – exportfixtures | Implementerat | PR #44; klassificering av native/hybrid/rasteriserad PDF/PPTX-fallback |
| IP-009 – exportplan och formatadaptrar | Implementerat | PR #45–46; planering, hjälpfunktioner och faktiska PDF/PPTX-skrivare separerade |
| IP-010 – profileringsunderlag | Implementerat | PR #47; mätinstrument och automatiserad profileringskörning |

PR #38, #39 och #41–#47 är mergade. IP-004 ingick i mellanliggande leverans. Senaste korrigerade IP-010-profil och kandidatverifiering var gröna före merge.

## 2. Vad som förbättrats

- Redigerarens ansvar har minskat genom separata controllers för lokal lagring och export.
- Exportklassificering, formatadapter och PDF/PPTX-skrivare har egna gränser.
- Flera konkreta dataförlust- och no-op-risker har testsäkrats.
- Releaseprocessen gör explicit skillnad mellan grön CI och faktisk produktacceptans.
- Profilering ger ett reproducerbart underlag för ett senare historikbeslut.

Detta styrker arkitektonisk framdrift, inte att samtliga ursprungliga krav är uppfyllda.

## 3. Kvarstående risker och prioritering

**P0 – produktacceptans/release (blockerar READY)**

1. `RG-005`: Safari på fysisk iPhone/iPad, installerad PWA, offlineomstart, lagringskvot och touch – manuella belägg saknas.
2. `RG-006`: PowerPoint på macOS/Windows ska öppna, redigera och spara exporter utan reparation – manuella belägg saknas.
3. `RG-007`: tillgänglighet och godkända visuella referenser – manuella belägg saknas.
4. `RG-008`: oberoende PDF-läsare och svensk textsökbarhet – manuella belägg saknas.
5. `RG-009`: migration av verkliga äldre PPD 0.1/0.2-original är blockerad av saknat originalmaterial.
6. `RG-010`: kvarvarande AT-acceptansmatris är inte fullständigt attesterad.

**P1 – mätbar prestandarisk**

En körning av IP-010 i GitHub-hostad Linux/Node 22 gav för 20 slides/128 KiB inbäddat data 7,0 ms median, 12,7 ms p95 och +2,2 MB heap över 12 transaktioner. För 100 slides/2 MiB data: 76,5 ms median, 122,5 ms p95 och +17,9 MB heap. Detta är indikativa siffror för en syntetisk titelredigeringsbelastning, inte mobil-Safari-resultat.

**P1 – data- och regresseringsrisk**

- In-flight IndexedDB-skrivning vid dokumentbyte bör få separat regressionsprov: sena statusnotiser får inte påverka ett nyöppnat dokument.
- IP-008 testar preflightklassificering och de befintliga webbläsartesterna undersöker filstrukturen; en referenskorpus med kvalitetsbedömd visuell/funktionell tolerans saknas.
- PPD:s dynamiska `D`-fält är fortfarande betydande; IP-007 typade endast vanliga kommandogränser.

**P2 – framtida arkitektur**

Avancerade PPD-objekt, rik text, layout/overflow och långvarig PWA-cachehantering behöver följas enligt `docs/release-review.md`. Ingen bred omskrivning bör startas utan prioriterad krav- och testtäckning.

## 4. Beslut och rekommenderad ordning

1. **Behåll release readiness = NOT_READY** enligt releaseprofilen. Automatiska kontroller är inte ersättning för de manuella grindarna.
2. Genomför en *acceptanssprint* för RG-005–RG-010 och registrera daterade belägg och testutrustning. Markera ej utförda prov som PENDING/BLOCKED.
3. Profilera IP-010 minst tre gånger på identisk maskin samt på en faktisk iPad. Isolera tid för `structuredClone`, historikbudgetens `JSON.stringify` och schema-validering. Besluta därefter om optimering med objekt-/strukturell delning eller coalescing; optimera inte i blindo.
4. Lägg till ett regressionstest för dokumentbyte under pågående CAS-skrivning.
5. Förnya slutgranskningen och releasebedömningen först när aktuella belägg finns.

## 5. Avgränsning och spårbarhet

Underlag: `docs/release-gates.json`, `docs/release-review.md`, `docs/verification-strategy.md`, `docs/export-regression-fixtures.md`, `docs/history-profiling.md`, PR #38/#39/#41–#47 och IP-010-körningen. Varken fysiska Apple-enheter, Microsoft Office eller en oberoende PDF-läsare har kontrollerats i denna granskning. Ingen produktionskod ändras i denna PR.
