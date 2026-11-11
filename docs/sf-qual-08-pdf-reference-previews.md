# SF-QUAL-08 – PDF-referensbilder i acceptanspaketet

## Syfte

Underlätta manuell jämförelse mellan exporterad PDF och verklig PowerPoint-visning genom att bifoga tydliga PNG-referenser i det befintliga SF-QUAL-07-paketet. Det är **inte** en automatisk attest av Office- eller PDF-fidelitet.

## Genomfört

- `scripts/generate_export_acceptance.mjs` rasteriserar de tre sidorna i **den PDF som redan ingår** i paketet med `pdftoppm` (Poppler).
- Genererar `pdf-reference-1.png` till `pdf-reference-3.png`, alltid 1280 × 720.
- Kontrollerar bilddimensioner och att varje referensbild innehåller synliga variationer, så att tomma resultat fångas.
- Registrerar PNG-filerna och deras SHA-256 i `manifest.json`. Posten `previews` kopplar varje referensbild till ett bild-ID och anger att dess källa är `acceptance.pdf`.
- Uppdaterar instruktioner och protokoll för PowerPoint Mac/Windows. Inga manuella resultat sätts automatiskt till PASS.

## Användning

Hämta artefakten `slide-fable-visual-evidence` från en godkänd GitHub Actions-körning. Öppna `export-acceptance/` och jämför PDF-förhandsbilderna med motsvarande PPTX-bilder i den PowerPoint-installation som ska accepteras.

Jämförelsen kan identifiera avvikande formplacering, försvunnet bildinnehåll, fontsubstitution och felaktig textlayout. Om båda exporterna avviker likadant från redigeraren fångar dock inte den här jämförelsen det – den kräver ytterligare editorreferenser och manuell kontroll.

## Acceptanskriterier

- Generatorn och den ordinarie kandidatverifieringen passerar i CI.
- Tre PNG-referenser produceras ur den medföljande PDF:en, kan avkodas och finns i manifestet med SHA-256.
- RG-006 (PowerPoint Mac/Windows) och RG-008 (oberoende PDF-läsare) förblir **PENDING** till dess faktiska prov genomförts.
- Projektets releasebedömning förblir **NOT_READY**.

Ingen ändring av produktionskod eller PPD-/PDF-/PPTX-exportalgoritmen.
