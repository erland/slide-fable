# Slide Fable

**Presentationsverktyg i webbläsaren – även som installerbar PWA.**

Slide Fable är ett svenskspråkigt presentationsverktyg byggt med React, TypeScript och Vite. Målet är att läsa, skapa, redigera, presentera och exportera presentationer i det öppet dokumenterade PPD-formatet, på dator, surfplatta och telefon. Redigering lämpar sig främst för större skärmar.

**[Öppna Slide Fable på GitHub Pages](https://erland.github.io/slide-fable/)**

> **Utvecklingsversion:** GitHub Pages-adressen är den avsedda installationsadressen. Publicering sker **endast efter en lyckad `Verify Slide Fable candidate`-körning för aktuell `main`-commit**; en push till `main` i sig räcker inte. GitHub Pages måste vara konfigurerat med **GitHub Actions** som källa. Projektets aktuella releasebedömning är **NOT_READY** för fullständig MVP/produktion; se [releasegranskningen](docs/release-review.md). En tillgänglig demo är inte ett godkännande av alla funktioner.

## Kom igång

### Använd i webbläsaren eller installera

Öppna [Slide Fable](https://erland.github.io/slide-fable/) via HTTPS. För att installera som app:

- **iPhone/iPad (Safari):** använd Dela-menyn och välj **Lägg till på hemskärmen**.
- **Mac (Safari):** välj **Arkiv → Lägg till i Dock** där funktionen stöds.
- **Chrome/Edge på dator:** använd webbläsarens installationsfunktion när den erbjuds.

Besök appen med internetanslutning första gången. När appen anger att den är redo för offline kan redan cachade delar användas utan nät. Webbläsarens lagring kan rensas av systemet: exportera och säkerhetskopiera viktiga presentationer. Installations- och offlinebeteende på fysisk iPad/iPhone är ännu inte slutligt verifierat.

### Kör lokalt från källkod

Kräver **Node.js 22.16.0 eller senare**, enligt `package.json` (GitHub Actions använder 22.16.0).

```sh
npm ci
npm run dev
```

Öppna adressen som Vite visar. Bygg och förhandsgranska produktionsversionen:

```sh
npm run build
npm run preview
```

Om katalogen `preview/` har genererats eller följer med din distribution kan den statiska förhandsversionen provas med:

```sh
python -m http.server 8000 --directory preview
```

Öppna då http://localhost:8000. En PWA behöver serveras via localhost eller HTTPS; öppna inte appens `index.html` direkt som fil.

## Funktioner i utvecklingsleveransen

- Import, validering och redigering med PPD-modell och JSON Schema.
- Bild- och objektredigering, layouter, teman, texthantering och lokal återställning.
- Presentationsläge samt export till fristående HTML, PDF, PPTX, PNG och JPG.
- Responsivt PWA-gränssnitt med stöd för offlineanvändning och uppdateringar.
- Dokumenterade begränsningar, testfall, exempel och exportvarningar.

**Observera:** delar av redigeringssemantiken, avancerade objekt, exporttrohet, tillgänglighet och plattformstester är fortfarande ofullständiga. Läs [vad som faktiskt verifierats och återstår](docs/release-review.md) innan verktyget används för kritiska presentationer.

## Tester och kvalitet

```sh
npm run lint
npm test
python -m pip install -r requirements-dev.txt -r requirements-dev002.txt
npx playwright install --with-deps chromium
python scripts/verify_release_candidate.py
```

[Verifieringsworkflow](.github/workflows/verify.yml) kör automatiska kandidatkontroller på push och pull requests. De ersätter inte manuella prov på fysiska Apple-enheter eller i Microsoft PowerPoint.

## Release och GitHub Pages

[Deploy-workflow](.github/workflows/deploy-pages.yml) startar via `workflow_run` **efter att `Verify Slide Fable candidate` avslutats**. Publiceringsjobbet körs bara när verifieringen lyckats på `main` genom push eller manuell verifieringskörning, källrepositoryt stämmer och den verifierade committen fortfarande är aktuell `main`. Det checkar ut **exakt verifierad commit**, kör `npm ci` och `npm run build` med `SF_BUILD_ID` satt till commit-SHA och publicerar `dist/`. Lint, fullständiga tester och Playwright-verifiering utförs i [verifieringsworkflowen](.github/workflows/verify.yml), inte på nytt i deploy-jobbet. GitHub-releaser eller manuell start av deploy-workflowen är **inte** publiceringstriggers. Visad byggidentitet baseras på commit-SHA, inte på en release-tagg.

Första gången behöver **Settings → Pages → Build and deployment → Source** ställas in på **GitHub Actions**. Kontrollera att deploy-jobbet verkligen passerar och att tjänsten fungerar innan installationslänken betraktas som tillgänglig. Deploy och releaseacceptans är skilda beslut; projektet är fortfarande **NOT_READY** för full MVP/produktion.

## Aktivt presentationsformat

Nya dokument skapas som **PPD 0.4.0** i `src/core/model.ts`; `schemas/ppd.schema.json` är det aktiva 0.4.0-schemat. Äldre 0.3.1-schema finns separat i `schemas/ppd-0.3.1.schema.json`. Detta beskriver **implementerad formatversion**, inte att alla formatfunktioner har fullständig UI-/PDF-/PPTX-paritet eller att releasen är accepterad. Se [PPD-kontraktet](docs/ppd-contract.md).

## Dokumentation

Börja gärna i [dokumentationsöversikten](docs/README.md), som skiljer aktuell produktvägledning från äldre steg- och verifieringsrapporter. Historiska dokument behålls som spårbarhet, inte som dagens rekommenderade arbetsordning.


**För aktuell CI- och driftstatus:** se [STATUS.md](STATUS.md). Dokument under `docs/` med ett uttryckligt historiskt datum beskriver en tidigare avstämning och ska inte läsas som status för senaste `main`.


- [Användarguide](docs/user-guide.md) – redigering, tabeller och diagram, paneler, sparande, återställning och export.
- [Funktionell specifikation](docs/functional-specification.md) – målet för MVP samt källbelagd implementerad funktionsprofil.
- [Arkitektur](docs/architecture.md) – teknisk uppbyggnad.
- [PPD-kontrakt](docs/ppd-contract.md) – presentationsformatet.
- [Drift och felsökning](docs/operations.md) – byggning, hosting och uppdateringar.
- [Releasegranskning](docs/release-review.md) – täckning, begränsningar och öppna krav.
- [Utvecklingsplan](docs/development-plan.md) – steg och kriterier.

Referensmaterialet ligger i `reference/`. Maskinläsbar projektstatus finns i `.system-builder/work-status.yaml`.
