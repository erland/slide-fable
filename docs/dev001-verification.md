# DEV-001 – verifiering och leveransgräns

Leveransdatum 2026-10-19. Steget avser formatkontrakt, kompatibilitetsbeslut och
testfacit. Alla GAP-01–12 har beslut, spårning och relevant exekverbar evidens
eller uttryckligt avgränsad framtida kontroll. Referensfilerna är oförändrade.

## Körning
`python scripts/verify_dev001.py` kör kontraktsstester och projektets referens-,
beroende-, status- och hygienkontroller. Korpus har 58 självständiga JSON-fall:
giltiga modeller, felaktiga modeller samt separat kompatibilitetsklassning.
Unittest-sviten har tio testmetoder, varav en kör samtliga manifestfall som subtests.
Migrations-/hash-/JSON-regressionerna ligger utöver dessa JSON-fixturer.

## Bindning till källa
Maskinresultatet i `.system-builder/dev001-verification.json` registrerar SHA-256
för verifierade materialfiler och en sammanvägd hash. Projektstatus/rapporter under
.system-builder exkluderas så att en ren completion-övergång inte ändrar verifierad
implementation. Referenshasharna kontrolleras separat. Statusändring följs av
lättviktskontroll; efter paketering återkörs verifieringen på en uppackad kopia.

## Inte verifierat eller implementerat
Ingen browserapp, import av faktisk HTML, service worker, textlayout, PDF-/PPTX-
export, faktisk Office-ändring eller enhetsinstallation finns i detta steg.
SVG-/MathML-/LaTeX-rendering och full produktionssanering kvarstår i DEV-002/004.
0.1/0.2-migration är fortsatt ett MVP-krav och är uttryckligen overifierad.
GitHub-workflow följer med, men endast motsvarande lokala kommandon har körts.
