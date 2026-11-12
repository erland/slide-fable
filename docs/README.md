# Dokumentation – läsanvisning och status

Dokumentationen i Slide Fable innehåller **både aktuell vägledning och historiska, daterade utvecklingsprotokoll**. Dokument som beskriver en äldre PR, en viss commit eller ett enskilt test får inte tolkas som att samma status gäller senaste `main`.

## Börja här för dagens kod

| Behov | Dokument |
| --- | --- |
| Start, installation och utveckling | [Projektets README](../README.md) |
| Daterad status för senaste kontrollerade commit | [STATUS](../STATUS.md) – jämför alltid med [GitHub Actions](https://github.com/erland/slide-fable/actions) |
| Användarflöden och tangentbord | [Användarguide](user-guide.md) |
| Implementerad systemarkitektur | [Arkitektur](architecture.md) |
| Aktivt PPD-format och versionsgränser | [PPD-kontrakt](ppd-contract.md) |
| Implementerade exportvägar och kompatibilitetsmål | [Exportpolicy](export-policy.md) och [exporttäckning](export-coverage.json) |
| Bygge, driftsättning och felsökning | [Drift](operations.md) |
| Funktionella krav jämfört med nuvarande kod | [Funktionell specifikation](functional-specification.md) och [responsiv UX](responsive-ux.md) |
| Återstående acceptans | [Releasegranskning](release-review.md) och [releasegrindar](release-gates.json) |

**Viktigt:** `NOT_READY` är den senaste dokumenterade samlade releasebedömningen. En grön GitHub Actions-körning verifierar en viss commit inom testernas omfattning men är inte samma sak som full acceptans i Safari/iOS, PowerPoint, hjälpmedel och oberoende PDF-läsare.

## Dokumentationsgranskningen

- [DOC-AUDIT-01 – användar- och driftdokumentation](doc-audit-01-current-user-ops.md)
- [DOC-AUDIT-02 – arkitektur, PPD och export](doc-audit-02-architecture-ppd-export.md)
- [DOC-AUDIT-03 – funktioner, UX och acceptans](doc-audit-03-functions-ux-acceptance.md)
- [DOC-AUDIT-04 – historiska rapporter och filreferenser](doc-audit-04-history-reference-integrity.md)

De fyra stegen beskriver gjorda kontroller, rättade avvikelser och vilka manuella kontroller som inte har utförts.

## Historik – läs som belägg vid respektive datum

| Dokumentgrupp | Hur den ska användas |
| --- | --- |
| [Ursprunglig utvecklingsplan](development-plan.md) och [fortsättningsplan](continuation-plan.md) | Ursprungliga mål, etappindelning och tidigare ”nästa steg”, **inte aktuell exekveringsorder** |
| [Nuläge 2026-11-08](current-state-2026-11-08.md), [SF-NEXT-09](sf-next-09-candidate-verification.md) | Daterade status- och CI-observationer |
| Stegrapporter med DEV-, SF-NEXT-, SF-GAP- och SF-ANIM-prefix | Vad som implementerades och kontrollerades i respektive utvecklingsetapp |
| SF-QUAL- och SF-STAB-rapporter | Kvalitet, stabilisering, referensbilder och releaseunderlag från respektive förändring |
| PPD-001 till PPD-004 och PPD040-rapporter | Format-/egenskapsutveckling och äldre formatbeslut; aktivt schema beskrivs i [PPD-kontraktet](ppd-contract.md) |
| [Historisk PPD 0.3-granskning](format-review.md), [underlag i reference](../reference/README.md) | Ursprungliga krav och verifieringsunderlag, **inte dagens aktiva PPD 0.4-schema** |
| [Historisk UX-granskning](ux-review-sf-next-02.md) | Fynd vid ursprunglig granskning; exempelvis UX-02-01 har senare åtgärdats |

Att en äldre rapport innehåller ord som ”PASS”, ”klart” eller ”nuvarande” beskriver rapportens **egen** källrevision. Sådana texter ska inte massuppdateras i efterhand, eftersom det skulle förstöra spårbarheten. Använd [STATUS](../STATUS.md) för en explicit daterad ögonblicksbild och GitHub Actions för de senaste körningarna.

## Länk- och referensintegritet

DOC-AUDIT-04 kontrollerar existensen av lokala mål för vanliga Markdown-länkar och explicita filreferenser i dokumentationen. Kontrollmetoden och dess avgränsningar finns i [granskningsrapporten](doc-audit-04-history-reference-integrity.md). Externa webblänkar, historiska commit-/PR-resultat och rubrikankare behöver kontrolleras separat för fullständig semantisk riktighet.
