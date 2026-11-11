# SF-QUAL-09 – oberoende redigerarreferenser i exportpaketet

## Syfte

Göra det möjligt att jämföra samma presentations innehåll i **tre olika återgivningar**: Slide Fables faktiska redigerare, exporterad PDF och PowerPoint. Den tredje återgivningen (PowerPoint) kräver fortfarande verkliga manuella prov.

## Genomförande

- SF-QUAL-07-generatorn skapar samma PPD, PDF och PPTX som tidigare.
- Efter exporten öppnas exakt PPD-dokumentet i Slide Fables vanliga editor store i Chromium.
- Generatorn väljer var och en av presentationens tre bilder med `selectSlide`, väntar på att bildens objekt återgivits och på att synliga bilder och typsnitt laddats.
- Screenshots tas från `.stage .slide-render` med Playwright och normaliseras till 1280 × 720 pixlar.
- Filerna `editor-reference-1.png` till `editor-reference-3.png` sparas tillsammans med tidigare `pdf-reference-1.png` till `pdf-reference-3.png`.
- Alla sex referensbilder ingår med SHA-256 i manifestet. `editorPreviews` anger bild-ID, bildstorlek och att källan är den levande redigerarvyn.

## Testbarhet och gränsdragning

Ett genererat editorfoto får inte baseras på PDF-rendering. All rendering av själva redigerarreferensen sker i React/Chromium via editor store. Automatiken kontrollerar att förväntade objekt finns på den valda bilden, att screenshotfilerna går att avkoda, har rätt dimensioner och innehåller synliga variationer.

En pixeljämförelse mellan redigerare och PDF kommer fortfarande att påverkas av olika text-/renderingsmotorer och är **inte** godkänd i sin helhet bara för att bilderna finns. Om PPTX öppnas i faktisk PowerPoint ska testaren tillföra separata skärmbilder för att kunna avgöra om en avvikelse uppstod i exporten eller vid PowerPoint-rendering.

## Acceptans

- Sex PNG-bilder (tre från redigeraren och tre från PDF) följer med den verifierade artefakten tillsammans med PPD/PDF/PPTX.
- De sex filerna har SHA-256 och provenance i `manifest.json`.
- Inget automatiskt resultat påstår PowerPoint-acceptans eller ändrar `RG-006`, `RG-008` eller `NOT_READY`.

Detta steg ändrar bara exportens **verifieringsunderlag**, inte den användarvända exportmotorn.
