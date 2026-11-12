# DOC-AUDIT-04 – historiska rapporter, navigering och referensintegritet

**Datum:** 2026-11-12. **Avstämd kodrevision:** `main` `f0a49df049fa611dd7582d272631a29bc74856ca` före denna dokumentations-PR. Arbetet avslutar den planerade fyrdelade dokumentationsgranskningen DOC-AUDIT-01–04. **Releasebedömning:** `NOT_READY`, oförändrad.

## Genomförd inventering

GitHub-trädet innehöll vid avstämningen **86 Markdown-dokument** i projektroten, dokumentationskatalogen och referenskatalogen (inklusive de tidigare auditrapporterna). De inventerades som aktuella guider, normerande mål eller historiska steg-/verifieringsunderlag.

Den maskinella **mål-existenskontrollen** genomfördes mot alla 86 dokument. Den sökte efter:

- vanliga Markdown-länkar med lokal relativ sökväg (externa HTTP(S)-länkar undantogs)
- kodmarkerade explicita projektfilsökvägar som slutade på `.md`, `.yaml`, `.json`, `.txt` eller `.py` och innehöll katalogseparator
- normaliserade relativa Markdown-sökvägar med `..` och `.` mot GitHub-trädets filnamn

**Resultat:** totalt **177 kontrollerade förekomster** av lokala länkmål och explicita filreferenser enligt reglerna ovan. **0 saknade mål** hittades. Kontrollernas batchantal var 68, 45, 26, 13, 0, 0, 7, 8 och 10 förekomster för respektive delmängd av dokumenten (86 totalt).

Detta är **inte** en fullständig semantisk länkkontroll. Externa webbadresser har inte öppnats, rubrikankare efter `#` har inte validerats, länkar i annat än de angivna textmönstren kan saknas, och tidigare URL:er till PR-/CI-körningar har inte individuellt omverifierats. Konkreta filreferenser med mellanrum och wildcard behandlades inte som faktiska filvägar.

## Rättade dokumentationsproblem

| Dokument | Konstaterat problem | Rättning |
| --- | --- | --- |
| `docs/continuation-plan.md` | Den ”aktuella läsanvisningen” pekade framåt utifrån PR #120 och kunde misstolkas som dagens arbetsordning | Märkt hela fortsättningsplanen som historisk och länkat till aktuella dokumentationsingångar |
| `docs/current-state-2026-11-08.md` | Äldre CI-/PR-status och dåvarande ”nästa steg” kunde fortfarande blandas ihop med dagens status | Förtydligat att uppgifterna enbart avser snapshot 2026-11-08 |
| Det ursprungliga PPD 0.3-underlaget i `reference/` | Äldre referensfiler kan förväxlas med dagens aktiva PPD 0.4-schema | Förklarat underlagets historiska roll i den nya dokumentationsöversikten. **Alla sex SHA-skyddade originalfiler, inklusive referenskatalogens README, lämnas oförändrade.** |
| `STATUS.md` | Kallades ”aktuell” trots att det visade en äldre `main` och äldre deploy | Avstämt nytt `main` och en **daterad** verifierad körning; deployens dåvarande status anges som pågående, inte godkänd |
| `README.md` | Ingen enda ingång som skilde nuvarande användar-/teknikdokumentation från historiska verifieringsrapporter | Lagt in länk till ny [dokumentationsöversikt](README.md) |
| `docs/README.md` | Saknades | Skapat en sammanhållen översikt med kanoniska ingångar och kategorisering av historiska rapporter |

## Bevarade äldre källor

Följande grupper **behålls som historiskt evidens**, utan massomskrivning av äldre testresultat: DEV-etapper, SF-NEXT, SF-GAP, SF-ANIM, SF-QUAL, SF-STAB, PPD-001–004, PPD040, källpaketet i `reference/` samt tidigare daterade nuläges-/releasebeslut.

Motivet är spårbarhet: ett tidigare `PASS` gäller exakt den testade koden och metoden, inte automatiskt senaste `main`. Ett tidigare fel kan vara åtgärdat utan att den gamla rapporten därmed ska raderas.

## Samlad slutsats för DOC-AUDIT-01–04

1. **DOC-AUDIT-01:** användar-/driftdokumentation avstämd mot nodversion, autosparning/arbetskopior, layoutbyte och deploygrindar.
2. **DOC-AUDIT-02:** arkitektur och PPD 0.4 samt exportmoduler avstämda mot kod; mål och faktisk exporttäckning särskilda.
3. **DOC-AUDIT-03:** funktionell specifikation och responsiv UX avstämd; tidigare avhjälpta fel och återstående acceptansgrindar märkta.
4. **DOC-AUDIT-04:** dokumentationsnavigering och historisk status klargjord; ovanstående 86 dokument genomgångna avseende lokala mål enligt specificerade kontrollregler.

**Slutsats:** Den planerade dokumentationsrevisionen är genomförd inom angivet scope. Det betyder inte att alla påståenden i alla historiska rapporter har återtestats mot kod, eller att alla referenser och rubrikankare semantiskt verifierats. Fortsatta kodändringar behöver löpande hålla [användarguiden](user-guide.md), [arkitekturen](architecture.md), [funktionella specifikationen](functional-specification.md) och [STATUS](../STATUS.md) uppdaterade. Full acceptans för Safari/iOS, Office, PDF-läsare och tillgänglighet är fortfarande separat.

## Verifieringskrav för denna PR

- Dokumentationsändringar får inte modifiera den historiskt integritetsskyddade referensmodellen eller releasegrindarnas status.
- Automatisk verifiering, inklusive planeringskontroll, ska bli grön på PR:ns **slutliga HEAD** innan merge.
- En grön dokumentations-PR innebär inte att en ny Pages-deploy lyckats eller att `NOT_READY` ändrats.
