# Funktionell specifikation – Slide Fable 0.1

## Omfattning och normativ bas
Originalspecifikationen i `reference/ppd_presentationsverktyg_funktionell_specifikation_v0_3.md`
införlivas genom referens med prioriteringen i produktgrunden. Alla ursprungliga
krav behåller sina ID:n och prioriteter. Ingen funktion stryks för att tidigare
text kallar den B när senare normativ text säger M. Spårning finns maskinläsbart.

Full MVP omfattar bland annat master/platshållare, rik text/listor, grupper,
komponenter inom dokumentet, lager, snapping, bildbeskärning, redigerbara tabeller,
bar/line/pie, process/hierarki/tidslinje, ekvationer, vektorbanor, anteckningar,
presentatörsvy, ångra, återställning, HTML/PDF/PPTX/PNG/JPG och diagnostik.
Nästa nivå: frihand, actions, avancerad text, media, galleri, kodblock och fler
diagram. Senare: 3D, kartor, bifogade dokument, samarbete och AI. En importerad
frivillig typ utanför editorns profil ska ändå hanteras säkert med fallback eller
tydligt begränsat läsläge; dess ursprungspayload ska inte försvinna.

## PWA- och enhetskrav
| ID | Krav | Verifierbart acceptanskriterium |
|---|---|---|
| SF-001 | Responsiv editor | 390×844, 768×1024, 1024×768 och 1440×900 CSS-px; inga oåtkomliga kommandon eller horisontellt sidscrollande paneler |
| SF-002 | Likvärdig grundredigering | Skapa, öppna, ändra text, flytta via drag eller numerik, ordna slides, ångra, spara och presentera på samtliga målenheter |
| SF-003 | Installation | Manifest, ikoner, HTTPS och fungerande fristående start; installationshjälp anpassad till observerat webbläsarstöd |
| SF-004 | Offline-app | Efter slutförd första cachelagring startar appen offline, öppnar lokalt dokument och kan redigera och spara HTML |
| SF-005 | Återställning | Transaktionell arbetskopia och revisionskontroll; avbruten lagring förstör inte senast bekräftade kopia; tydlig kvot-/lagringsvarning |
| SF-006 | Pekning och tangentbord | Touch/mus/pennpekare via gemensamma operationer, synligt fokus, ingen obligatorisk hover; primära touchmål minst 44×44 CSS-px |
| SF-007 | Säker appuppdatering | Ny service worker aktiveras vid säkert byte; osparad redigering eller pågående export avbryts inte av automatisk omladdning |
| SF-008 | Portabla filer | File input och Blob-nedladdning är bas; direktskrivning/delning är bara kapacitetsstyrda tillägg |
| SF-009 | Lokal integritet | Inga dokument/resurser lämnar enheten utan explicit export-/uppladdningsval; ingen obligatorisk telemetri |
| SF-010 | Begripliga sparstatusar | Skilj Ändringar i minnet, Arbetskopia sparad lokalt och Fil exporterad; misslyckande får inte visas som sparat |
| SF-011 | Säker samtidighet | Två flikar får inte tyst skriva över varandras revisioner; andra fliken blir läsläge eller skapar en uttrycklig kopia |
| SF-012 | Publikexport | Val om anteckningar/proveniens; varna att återimporterbar HTML innehåller underliggande modell, även innehåll som inte visas |

## Användarflöden
Start → Ny från mall/Öppna fil/Återuppta → Redigera → Förhandskontroll →
Presentera eller Exportera. Export visar format, profil, urval och objektrapport.
Import valideras i isolerad temporär modell; aktuell arbetskopia byts först när
importen kan accepteras. Misslyckad export behåller dokumentet och erbjuder försök igen.
En borttagen resurs används inte av andra objekt förrän referensräkning kontrollerats.

## Icke-funktionella mål
Föreslagna pilotbudgetar, ännu inte uppmätta: 20 slides/200 objekt, 25 MiB total
inbäddad resursdata; vanlig navigation p95 <100 ms och inputrespons p95 <100 ms
på en namngiven referens-iPad och laptop. Mät även telefon separat. Mål för
importfil 50 MiB och enskild bild 10 MiB är konfigurerbara skydd, inte formatgränser.
Bilddimensioner, objektantal, formeldjup och SVG-komplexitet begränsas också.
Tunga operationer ska kunna avbrytas utan modellförlust.

## Utanför första leverans
Ingen inloggning, serverdatabas, realtidssamarbete, AI-tjänst, PPTX-import,
appbutikspublicering eller abonnemang. Ingen automatisk synk mellan enheter;
användaren flyttar sin HTML-fil. Inga sådana framtidskrav hindrar första delmålet.
