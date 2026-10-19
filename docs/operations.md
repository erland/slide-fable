# Byggning och drift

## Lokal utveckling

Node 22.12 eller senare, npm och Python 3.12 rekommenderas. Låsfilen äger
paketversionerna. Paketets version är 0.5.0 och finns i package.json; genererat
manifest och byggidentitet kommer från källprojektet. Ingen servernyckel eller
miljöhemlighet krävs.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Byggningen kopierar licensierade lokala typsnitt, skapar appikoner, typkontrollerar,
bygger statiska filer och genererar service worker från innehållshashar. Produktions-
resultatet finns i dist; leveransens kopia finns i preview. Installera inga
beroenden från okända CDN:er i den färdiga appen.

## Verifiering

```sh
python -m pip install -r requirements-dev.txt -r requirements-dev002.txt
npx playwright install --with-deps chromium
python scripts/verify_release_candidate.py
```

Miljön kan ange CHROMIUM_EXECUTABLE för ett befintligt Chromium. Skriptet kör
build, lint, kontrakt, editorflöden, offline-/uppdateringsfall och källkontroller.
Browser-skärmbilder och tillfälliga exporter hamnar utanför källprojektet.
Fjärr-CI-konfiguration följer med men en faktisk GitHub Actions-körning är inte
utförd här. För --require-ready krävs dessutom att alla öppna releasegrindar
stängts med belägg; annars blir avslutskoden 2.

## Statisk hosting

Servera preview/dist med HTTPS. En underkatalog stöds genom relativa resurser;
manifest och service-worker-scope avser katalogen där appen installeras.
Använd ingen generisk fallback som svarar med HTML för saknade JS-filer.
Servera sw.js och index.html utan lång HTTP-cache. Hashade resurser kan ha
lång cache. Lägg ut nya resurser innan index/sw och behåll äldre hashade resurser
under övergången. Ingen driftsättning till extern server har utförts.

En väntande uppdatering aktiveras först när användaren väljer det och alla
svarande flikar inom scope är rena och utan pågående export/import. Spara HTML i
ändrade flikar före uppdatering. Oförberedda flikar laddas inte om automatiskt.
Misslyckad precache behåller föregående fungerande offlineversion.

Appcacher behålls konservativt för äldre öppna flikar. Verifierad cachegallring
är fortfarande ett öppet krav före långvarig produktion. Rensa inte webbplatsens
lagring som en rutinuppgradering: då kan även lokala arbetskopior försvinna.
Säkerhetskopiera till HTML först. Lagringskvot och rensning styrs av webbläsaren.

## Säkerhet och felåterhämtning

Importerad HTML parsas som data med parse5, inte som aktiv DOM. Endast den inerta
PPD-payloaden används. Dubbla JSON-nycklar, brutna referenser, osäkra URL-scheman,
SVG-skript och externa SVG-referenser avvisas. Inbäddade resurser kontrolleras mot
angiven MIME-signatur och SHA när sådan finns. Offlineexport kräver SHA och inga
externa resurser. Appen har inga konton, serverlagring, analysanrop eller molnsynk.

Filen får högst vara 50 MiB, modellen högst 200 bilder/10 000 objekt, resurser
högst 10 MiB per resurs/25 MiB totalt. Bildinfogning begränsas till 40 megapixlar.
Detta är skyddsgränser, inte uppmätta prestandagarantier på en surfplatta.

0.3.0 migreras enligt fastställd 0.3.1-profil. 0.1/0.2 stöds endast för den
uttryckliga dokumenterade delprofilen i legacy.ts och medföljande fixtures.
Andra äldre dokument får inte utlovas fungera. Okända framtida modeller kan
öppnas i begränsat skrivskydd när en säker inspektionsmodell kan valideras;
originalet går då att ladda ned oförändrat.

Vid trasig import förblir aktuell modell intakt. Vid lagringsfel hämtas HTML som
säkerhetskopia. Vid flikkonflikt skapas en separat dokumentidentitet. Vid trasig
export får användaren ett felmeddelande och arbetsmodellen behålls.
