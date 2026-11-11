# SF-QUAL-10 – jämförelse av redigerare och PDF

## Syfte

Bygga vidare på SF-QUAL-09:s sex faktiska referensbilder med en reproducerbar **avvikelserapport per presentationsbild**. Jämförelsen gäller Slide Fables Chromium-redigerare mot den PDF som rasteriserats av Poppler. Den påstår inget om PowerPoint eller en oberoende PDF-läsare.

## Leverans

Efter `npm run acceptance:export` körs `npm run acceptance:compare` automatiskt i den ordinarie kandidatverifieringen. Resultaten bifogas i samma `slide-fable-visual-evidence/export-acceptance/`-paket:

- `difference-report.md`: människoläsbar rapport med en rad per bild och länkar till referenser.
- `difference-report.json`: maskinläsbara mätvärden, bild-ID, filnamn och tydlig diagnostikstatus.
- `difference-1.png`–`difference-3.png`: rödmarkerade områden där bildpixlarnas färgkanaler avviker mer än toleransen.
- Uppdaterat `manifest.json`: samtliga rapporter och bilder registreras med SHA-256.

Enhetsprov i `tests/export-fidelity-metrics.test.mjs` kontrollerar felfria fall, toleransberäkning och avvisning av felaktiga bilddimensioner.

## Mätmetod och begränsningar

Bilderna ska ha **samma bild-ID och exakt samma pixeldimensioner**. Integritet verifieras med SHA-256 från manifestet före jämförelsen. Transparenta områden plattas mot vitt, därefter beräknas för varje pixel den största avvikelsen mellan RGB-kanalerna:

- `meanAbsoluteChannelError`: medelvärdet av alla absoluta kanalavvikelser (0–255).
- `changedPixelPercent`: andel pixlar där **minst en** RGB-kanal avviker mer än 24 av 255.
- `maxChannelError`: största uppmätta absoluta kanalavvikelse.
- Skillnadsbild: röda pixlar visar avvikelser över toleransen; ljusgrå pixlar ligger inom toleransen.

Den angivna tröskeln används enbart för **diagnostisk färgmarkering och statistisk jämförelse**. Den är inte en beslutad acceptanstolerans. Skillnader i textkantutjämning, färghantering och mellanrendering kan ge utslag utan att motsvara ett felaktigt objekt.

Därför ska rapporten användas för att **lokalisera och prioritera avvikelser**, med manuell granskning av originalen sida vid sida. Den får inte automatiskt klassificera någon presentationsbild som korrekt, ändra releasegrindarna eller attestera verklig Office-redigering.

## Reproduktion

```sh
npm ci
npx playwright install chromium
npm run acceptance:export
npm run acceptance:compare
```

Första kommandot för generering behöver också Poppler/`pdftoppm` installerat. Sätt `EDITOR_OUTPUT` om testpaketet ska sparas på annan plats. Den efterföljande jämförelsen behöver endast de redan genererade PNG-filerna och Node-beroenden.

**Acceptans:** de tre paren jämförs, avvikelserapporten genereras och alla hänvisningar stämmer. RG-006 och RG-008 kvarstår `PENDING`; övergripande release kvarstår `NOT_READY`.
