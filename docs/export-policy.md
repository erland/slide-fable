# Exportpolicy och kompatibilitet – mål, inte verifierat stöd

| Objekt | PPD-HTML | PDF | PPTX editable-first |
|---|---|---|---|
| Text/listor | Struktur och text | Sökbar text där stödd | Native text/runs |
| Former/linjer/pilar | DOM/SVG | Vektor där stödd | Native objekt |
| Bild/beskärning | Inbäddad resurs + parametrar | Bild med rätt crop | Bildobjekt med dokumenterad crop |
| Tabell | Strukturerade celler | Text/vektor | Native tabell; merge provas |
| Bar/line/pie | Dataset + SVG | Vektor/bild med rapport | Native när bevisat, annars raster med bevarad data i PPD |
| Semantiska diagram | Noder/kanter + SVG | Vektor | Former, kopplingar, text; avvikelse rapporteras |
| Formel | Källa + säker rendering | Vektor/bild | Ekvation om bevisat, annars SVG/bild; källa i metadata där praktiskt möjligt |
| Vektorbana | Sanerad SVG + källa | Vektor | Freeform/SVG där bevisat, annars bild |
| Glas/blur | Effekt + fallback | Renderat effektlager | Bakgrundsberoende rasterlager, huvudtext separat |
| Framtida typ | Säker fallback eller läsläge | Poster eller blockering | Poster eller blockering, alltid rapport |

Exportreport: format, profil, modellrevision/hash, motorversion, slideId,
elementId, status (native/hybrid/rasterized/omitted/unsupported), orsak och
bevarad/förlorad redigerbarhet. Okänd obligatorisk funktion blockerar export.
Utelämning får ske bara genom explicit användarval efter rapport, aldrig tyst.
visual-first behåller huvudtext där möjligt och redovisar kompromisser;
flattened är ett uttryckligt val som redovisar förlorad objektsredigering.
I PDF/PPTX väljs statisk slutvy för fragment som standard; dolda slides exporteras
endast enligt uttryckligt urval. Publikvy får inte inkludera anteckningar.

Pilot mäter textbrytning och klippning separat från bildjämförelse. Föreslagen
starttolerans för geometri är 1 logisk enhet i referenscanvas; den måste kalibreras.
Fotoberoende blur får inte rasteriseras isolerat utan korrekt bakgrundskomposition.
Webbfonter innebär inte att mottagarens PowerPoint har samma font; rapportera substitution.
