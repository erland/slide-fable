# Slide Fable 0.5.0

Körbar svensk presentationsredigerare som PWA för dator, läsplatta och telefon.
Källkod, färdigbyggd app, tester, exempel och ursprungligt PPD-underlag ingår.
Utvecklingsarbetet har gått vidare genom import, redigering, återställning,
fristående HTML, presenterarläge samt PDF/PPTX/PNG/JPG-export och slutgranskning.

**Releasebedömning: NOT_READY.** Kvarvarande funktionella krav och obligatoriska
plattformstester redovisas i `docs/release-review.md`. Det här paketet är en
utvecklingsleverans och innebär inte att alla steg eller MVP-krav är godkända.
Maskinstatus och nästa åtgärd finns enbart i `.system-builder/work-status.yaml`.

## Prova

```sh
python -m http.server 8000 --directory preview
```

Öppna http://localhost:8000 och vänta på offline-redo. PWA:n behöver serveras;
index.html ska inte dubbelklickas. En exporterad presentations-HTML däremot är
en ensam fil som kan öppnas lokalt. För egen telefon/läsplatta behövs HTTPS.

För källkod: npm ci, npm run dev. För produktionsbygge: npm run build.
Node >=22.12. Ingen molntjänst eller hemlig konfiguration behövs.

## Läs mer

- `docs/user-guide.md` – redigera, spara, återställ, presentera och exportera.
- `docs/operations.md` – installation, test, hosting och uppdatering.
- `docs/release-review.md` – faktisk täckning och öppna releasegrindar.
- `docs/development-plan.md` – ursprungliga steg och klarkriterier.
- `docs/functional-specification.md` och `docs/architecture.md` – avsedd MVP.
- `docs/ppd-contract.md` – fastställt dataformat.

Tidigare dev001–003-dokument och exempel bevaras som historiska checkpoints.
De beskriver vad respektive leverans innehöll, inte den nuvarande funktionaliteten.
Originalunderlaget i reference är oförändrat och kontrolleras med SHA-256.

## Tester

```sh
npm run lint
npm test
python -m pip install -r requirements-dev.txt -r requirements-dev002.txt
npx playwright install --with-deps chromium
python scripts/verify_release_candidate.py
```

Automatiserade prov ersätter inte Safari/iPad-installation eller redigering i
PowerPoint för Mac/Windows. Ingen extern driftsättning eller fjärr-CI påstås.
