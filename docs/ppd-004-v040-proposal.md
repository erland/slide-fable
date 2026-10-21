# PPD 0.4.0 – konkret formatförslag (brytande version)

**Status:** föreslaget kontrakt, ännu **inte** driftsatt. Källa: `proposals/ppd-0.4.0.schema.json`. `schemas/ppd.schema.json` förblir 0.3.1 så att appen fungerar fram till en samordnad övergång.

## Varför version 0.4.0 och inte 0.3.2?

Användaren har uttryckligen prioriterat **en bättre modell framför bakåtkompatibilitet**. Därför föreslås att konturens färg/bredd m.m. hålls samman i `style.outline` i stället för separata `style.stroke` och `style.strokeWidth`. Det minskar konkurrerande representationssätt. Versionsnumret 0.4.0 markerar den avsiktliga brytningen; detta är ett förslag, inte en färdig applikationsmigration.

## Föreslagna formatfunktioner

| Funktion | Föreslagen representation | Typisk användning |
| --- | --- | --- |
| Yta på textruta/form | `style.fill` | Bakgrundsfärg, gradient |
| Kontur/linje/pilspets | `style.outline`: paint, width, dash, dashArray, cap, join, startMarker, endMarker | Ramar, pilar, streckade linjer |
| Teckenformat | `richRun.baseline`, `highlight`, `letterSpacing` | Upphöjt/nedsänkt, markering, spärrad text |
| Objektvändning | `flipX`, `flipY` | Spegelvända figurer, bilder |
| Justerbar formgeometri | `shapeAdjustments` | Rundningar, former med justerbara parametrar |
| Tabelllayout | `tableLayout.columnWidths/rowHeights/cellPadding`; `tableCell.borders` | Vanliga tabeller och kantlinjer |
| Diagramformatering | `chartFormatting.series` och dataetiketter | Seriefärger och sekundära axlar |
| Animationer | `slide.animations` med targetId, trigger, effect, durationMs, delayMs | Visa/dölj/flytta objekt i ordnad sekvens |

### Exempel: textruta med bakgrund, ram och typografi

```json
{
  "id": "box-1",
  "type": "text",
  "geometry": {"x": 100, "y": 100, "width": 550, "height": 180},
  "style": {
    "fill": {"color": "#FFF5D7"},
    "outline": {
      "paint": {"color": "#234567"},
      "width": 2,
      "dash": "solid",
      "cap": "round",
      "join": "round"
    },
    "color": "#183641",
    "fontSize": 32,
    "padding": 12
  }
}
```

Textinnehåll ligger dessutom i `text` eller `contentRef`, som idag. Det här förslaget ändrar inte hur man redigerar flera markerade objekt; `mixed` och `inherited` är fortfarande runtime-status, inte PPD-data.

## Medvetna avgränsningar

- Inte ett fullständigt PowerPoint/Keynote-filformat och ingen garanti om 1:1-import/export.
- Objektanimeringarnas första modell hanterar en liten vanlig effektuppsättning, inte Morph/Magic Move.
- Grupptransformationers koordinatsystem och representationsregler behöver ett eget ADR innan eventuell ytterligare brytande ändring.
- Semantiska specialobjekt, fullständiga 3D/media-objekt och avancerad samredigering ligger utanför första kontraktet.
- `chartFormatting` och `tableLayout` är avsiktligt snäva; komplettera efter renderer- och exportfixturer i stället för att använda obegränsade metadatafält.

## Plan för att använda det nya formatet

1. Godkänn eller revidera kontraktet (inklusive naming och animeringssemantik) utan att koppla om runtime.
2. Implementera modelldefinitioner och central adapter för `outline`, samt validering och generering av 0.4.0-dokument.
3. Uppdatera renderer, editor och export till `outline`, `flipX/Y`, tabell-/diagramformat och objektanimationer; testa webbrendering och PDF/PPTX där funktionerna har stöd.
4. Uppdatera `validateFull`, `negotiate`, import, HTML/JSON-serialisering, dokumentmallar och fixture-korpus **i en kontrollerad brytpunkt**. Då kan 0.3.1 eventuellt avvisas med ett tydligt fel om bakåtkompatibilitet inte önskas.
5. Gör `proposals/ppd-0.4.0.schema.json` till kanoniskt schema först när regressioner, schema, export och lagring är synkroniserade.

## Beslutsfrågor

- Ska `outline` vara den enda konturrepresentationen på samtliga objekttyper? **Rekommendation: ja.**
- Ska tabell- och diagramformat ha interna referenser till tema/tokens? **Rekommendation: ja, där redan etablerade fill/stilreferenser går att återanvända.**
- Ska PPD 0.3.1-filer importeras i 0.4-redigeraren? **Behöver inte garanteras**, men appen bör ge tydlig versionsdiagnostik i stället för tyst feltolkning.
