# SF-GAP-03 – formgalleri för processer och arkitektur

Utökning av Infoga → Former med fyra vanliga, redigerbara former:

| Form | PPD shapeType | Typiskt användningsområde | Native PPTX |
| --- | --- | --- | --- |
| Romb (beslut) | `diamond` | Beslut och vägval | diamond |
| Sexhörning | `hexagon` | System, komponent eller aktivitet | hexagon |
| Femhörning | `pentagon` | Etapper och markörer | pentagon |
| Chevron (flödessteg) | `chevron` | Sekvenser och processpilar | chevron |

**Arkitektur:** `src/core/shapeGeometry.ts` definierar normaliserade polygonpunkter som används i såväl galleriikoner som redigerarens objekt. Punkterna skalas till objektets geometri. Formtyperna lagras som befintliga `shapeType`-strängar i PPD 0.4; ingen schemamigrering.

**Redigering:** Former är vanliga shape-objekt med text, fyllning, kontur, geometri, lagerordning och ångra. PowerPoint exporterar som native preset-former och behåller redigerbarhet.

**Verifiering:** `tests/flowchart-shapes.test.mjs` validerar geometri och katalog; `tests/insert-gallery-browser.mjs` testar infogning, PPD-formtyp, SVG-geometri samt redigerbara PPTX-former på desktop, iPad-porträtt och mobil. Full projektregression via Verify Slide Fable candidate.

**Avgränsning:** Ett första urval av tekniskt och visuellt enkla processformer. Ikonbibliotek, bild-/SVG-symbolbibliotek, justerbara kontrollpunkter och mer avancerade former planeras i separata steg.
