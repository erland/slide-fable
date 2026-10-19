# DEV-003 – responsivt PWA-skal

## Leverans
React/TypeScript/Vite-projekt med arbetsyta, bildöversikt och dokumentpanel.
På dator visas tre ytor sida vid sida. På mindre skärmar väljer användaren en
panel åt gången. Provbilderna är avsiktligt exempel, inte importerade dokument.
Det går att byta bild, växla appens ljusa/mörka läge, prova ett arbetsnamn,
återställa provet och öppna installationshjälpen. Inget sparande påstås.

Det här är appstommen enligt DEV-003. PPD-parsern, verklig filimport och dokumentets
domänmodell kommer i DEV-004. Objektredigering kommer i DEV-005 och hållbar lokal
arbetskopia i DEV-006. Den separata exportspiken från DEV-002 finns fortfarande kvar.

## Installation och offline
Manifest, ikoner 192/512 samt maskable-ikon finns. Skalet kan köras från statisk
HTTPS-hosting, eller localhost vid lokal provning. Dator-Chromiums tekniska
installabilitetskontroll är godkänd. På Safari/iOS används plattformens menyer;
ingen universell installationsknapp eller fysisk enhetsacceptans påstås.

En service worker förbereder appens egen HTML, kod, stilar, fonter, ikoner och
manifest. Status visar offline-redo först efter aktivering. En ny flik kan öppna
appen offline. Appen använder inga CDN-fonter, externa API:er eller telemetri.
Detta bevisar offline-skal, inte framtida offlineöppning av egna presentationer.

Hashbaserad navigering fungerar även under en underkatalog, till exempel
/studio/#workspace. Service-worker-scope och cacher skiljer olika appbaser åt.
Ingen generell path-router eller server-API-fallback har införts.

## Säkra uppdateringar
- En ny worker förbereder sin kompletta appcache och väntar därefter.
- Användaren väljer uppdatering; ingen ovillkorlig skipWaiting vid installation.
- Väntande worker frågar samtliga öppna fönster inom sin scope via MessageChannel.
- Smutsigt dokumentläge eller pågående operation avvisar uppdateringen. En ren
  flik låser nya ändringar/operationer tills aktivering eller återställning.
- Om någon flik inte svarar avbryts försöket och rena flikars lås släpps.
- Bara en flik som deltog i låset och fortfarande är ren får automatisk omladdning.
  En nytillkommen/icke deltagande flik laddas inte om automatiskt.
- Misslyckad precache får inte ersätta föregående fungerande offlineversion.

UpdateSafety är återanvändbar för framtida dokumentkommandon och exporter. I detta
skal kopplas smutsigt läge till provnamnet; asynkron operationsspärr finns i
installationsflödet och har separata enhetstester för överlappande operationer.
Skalet har en beforeunload-varning, men den ersätter inte beständig dokumentlagring.

Äldre appcacher behålls tills vidare. Det skyddar redan öppna äldre klienters
hashade resurser, men innebär att flera versioner kan ta lagringsutrymme. Selektiv
gallring med verifierad klientversionskontroll ska införas innan långvarig drift;
användardokument ska aldrig blandas in i denna appcache.

## Verifiering
`python scripts/verify_dev003.py` kör lint, fyra enhetstester för lås/operationer,
typkontroll/produktionsbyggen och browserprov. Browserproven bygger test-A/test-B
och kontrollerar offline-start, skärmstorlekar, rotation, paneler, oförändrad
bilddesign vid temabyte, manifest/installabilitet, scopes och uppdateringsfelfall.
Testerna återställer ett normalt produktionsbygge efteråt. Kontrakts- och
projektkontrollerna från DEV-001 ingår som regression.

Kört på Chromium 153.0.8010.0 i denna miljö. Tablet/telefon använder emulerad
skärm och pekning. Faktisk Safari/iPad/iPhone-installation och WebKit-körning
kräver fortfarande annan miljö. Det är inget godkänt hårdvarutest.

## Provkör
Den färdiga statiska appen ligger i preview. Från projektroten:
`python -m http.server 8000 --directory preview`
Öppna http://localhost:8000 och vänta på offline-redo innan nätet stängs av.
Dubbelklick på index.html ger inte en installerbar PWA; använd HTTP/HTTPS.
En extern telefon/läsplatta behöver HTTPS för PWA-funktioner.

För källkod: npm ci, npm run dev. Produktionsbygge: npm run build. Node >=22.12.
Manifest/CSS/ikoner behöver inte redigeras för en vanlig underkatalogsdriftsättning.
För serveruppdatering: lägg ut nya hashade resurser före ny index.html/sw.js och
behåll gamla hashade resurser under övergången. sw.js bör serveras utan lång cache.

## Begränsningar innan release
Ingen filimport, sparad presentation eller objektsredigering ingår. Offlinecache
är browserlagring och kan rensas; kvot-/persistensflödet för dokument kommer separat.
Bakgrundsläggning på verklig iOS, installationsdialog och virtuellt tangentbord
måste granskas där. Appen är en utvecklingscheckpoint och inte färdig MVP.
