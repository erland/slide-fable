# SF-QUAL-07 – reproducerbart paket för exportacceptans

## Leverans och användning

Ett gemensamt referenspaket genereras från **samma PPD-dokument** via Slide Fables vanliga PDF-/PPTX-exportmotorer.

Efter godkänd kandidatverifiering: öppna GitHub Actions-körningen för **Verify Slide Fable candidate**, välj artefakten **slide-fable-visual-evidence**, och gå till `slide-fable-editor-evidence/export-acceptance/`. Där finns:

- `acceptance.ppd.json` – ursprunglig PPD 0.4-presentationskälla
- `acceptance.pdf` – PDF skapad med `editable-first`
- `acceptance.pptx` – PPTX skapad med `editable-first`
- `pdf-reference-1.png`, `pdf-reference-2.png`, `pdf-reference-3.png` – PDF-sidor rasteriserade med Poppler i 1280 × 720
- `editor-reference-1.png`, `editor-reference-2.png`, `editor-reference-3.png` – **oberoende skärmbilder från Slide Fables faktiska redigerarvy i Chromium**, för samma PPD-dokument; dessa är inte PDF-raster eller PowerPoint-bilder
- `manifest.json` – SHA-256, filstorlekar, commit och resultat av begränsade strukturkontroller
- `REVIEW-PROTOCOL.md` – manuellt provprotokoll med öppna RG-006 och RG-008

För lokal generering i en miljö där Node-beroenden och Playwright Chromium finns installerade:

```sh
npm ci
npx playwright install chromium
npm run acceptance:export
```

Förhandsbilderna genereras med Poppler (`pdftoppm`), som också behöver vara installerat lokalt. På Ubuntu kan det installeras med `sudo apt-get install poppler-utils`; på macOS exempelvis med `brew install poppler`.

Resultatet hamnar i `./export-acceptance/` när `EDITOR_OUTPUT` inte är satt. Använd gärna ett separat `EDITOR_OUTPUT` vid egna prov.

## Referenspresentation

Tre bilder med fastställda objekt-ID:n:

1. **Text och former** – svensk ÅÄÖ-rubrik, längre text, färgad bakgrund och fristående form.
2. **Inbäddad bild och grafik** – deterministiskt genererad PNG, text och separat form.
3. **Tabell och diagram** – sammanslagen tabellrubrik, regioner Norr/Söder, värden 42/73 och ett redigerbart stapeldiagram.

Bilderna använder PPD 0.4, logisk 1600 × 900-canvas och en reproducerbar innehållsfixtur. Den exporterade filens bytehash behöver **inte** vara konstant mellan körningar (zip/PDF-metadata kan variera), men varje generering dokumenterar SHA-256 för sina egna filer och kopplar dem till en commit.

## Automatisk verifiering

Generatorn använder den verkliga PDF-/PPTX-exporten och verifierar:
- Tre PDF-sidor och tre native PPTX-bilddelar.
- Att den svenska texten finns som PPTX-text.
- Att en redigerbar tabell, ett native diagram och ett inbäddat bildobjekt finns i PPTX.
- Att källan samt genererade filer sparas och kontrollerbara SHA-256-värden registreras.
- Att PDF:ens samtliga tre sidor kan rasteriseras till PNG med rätt dimensioner och synligt innehåll. Även PNG-filerna ingår i filmanifestet med checksumma.

En grön körning betyder **inte** att PowerPoint eller en fristående PDF-läsare har öppnat filerna. Det är medvetet inte en releaseattest.

## Nästa praktiska prov

Öppna `REVIEW-PROTOCOL.md` i artefakten. Verifiera i PowerPoint Mac och PowerPoint Windows att filen öppnas utan reparation, alla objekt är redigerbara, och att ändring/spara om/öppna igen fungerar. Kontrollera PDF separat i en extern läsare och dokumentera avvikelser med bild, objekt-ID och skärmbild. Detaljerade kriterier finns även i [kontrollprotokollet](sf-qual-07-office-review-protocol.md).

**Releasegrindarna RG-006 och RG-008 är fortfarande PENDING.** Den övergripande statusen för Slide Fable kvarstår `NOT_READY`.

## Avgränsning

Testpresentationen täcker inte alla varianter som rekommenderades i SF-QUAL-06, såsom maskad fotobeskärning, avancerade punktlistor eller samtliga diagramtyper. Den är en liten första referens som kan upprepas över plattformar. Utökningar ska bygga på dokumenterade avvikelser, inte på outtalade antaganden om Office-kompatibilitet.
