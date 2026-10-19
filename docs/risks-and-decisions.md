# Risker, beslut och öppna punkter

| Risk | Konsekvens | Åtgärd / grind |
|---|---|---|
| Bred MVP | Enkel demo felaktigt betraktas som färdig produkt | Delmål får egna namn; fulla originalkrav kvarstår |
| PPD-kontraktsglapp | Filer blir inkompatibla eller tappar data | DEV-001 stänger schema/prosa-frågor med fixtures |
| Sökbar PDF på iPad | Automatisk högkvalitativ offlineexport kan sakna bevisad väg | Exportspike i DEV-002 före bred editorimplementation |
| Rich text och fontmätning | Radbrytning/PPTX-klippning | Gemensam layout och tidig exportpilot |
| Glas/blur i PPTX | Bakgrund och redigerbarhet försämras | Separata kompositionslager och visual regression |
| Lokal lagring rensas eller fylls | Användardata försvinner | Transaktioner, kvotfel, persist-försök och tydlig filbackup |
| Touch och virtuellt tangentbord | Editor blir oåtkomlig på telefon | Anpassade paneler och faktisk Safari-testning |
| Publik fil innehåller metadata | Oavsiktlig spridning av anteckningar/proveniens | Explicit publikexport och förhandsgranskad rensningsrapport |
| Import av aktivt innehåll | Kod körs eller nätresurser hämtas | Inert dataparser, allowlists, CSP och negativa tester |

## Beslutslogg
ADR-001: Lokal PWA utan obligatorisk server föreslås som bas. Orsak: offline,
integritet och enkel drift. Följd: ingen automatisk enhetssynk, lagringskvoter
måste hanteras och filbackup är central.

ADR-002: PPD-modellen är sanningskälla; appskal och fristående presentation är
separata leveranser med delad renderer. Följd: två offline-testsviter krävs.

ADR-003: DOM/SVG först, ren domänkärna och adapterbaserade exporter föreslås.
Följd: textlayout och exportfidelitet blir tidiga bevispunkter. Beslutet kan
omprövas i DEV-002 med dokumenterad evidens utan att förvanska PPD-kontraktet.

## Kvar till tekniskt beslut
Ingen fråga kräver stopp före planeringsleverans. DEV-001 fastställer formatprofil,
ID-scopes och migration. DEV-002 väljer och låser bibliotek, SVG-sanitizer,
texteditor, fontpolicy samt offline-PDF-metod. Misslyckad genomförbarhet är en
verklig beslutspunkt före implementation; den får inte döljas med raster-PDF.
