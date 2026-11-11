# SF-QUAL-04 – visuell färgparitet mellan redigerare och PDF

## Mål

Komplettera geometrikontrollerna med en direkt visuell kontroll mellan bilden som användaren ser i Slide Fables redigerare och samma bild i en exporterad PDF. De tidigare proven kontrollerade koordinater, färg i PDF och inbäddat bildmaterial separat, men jämförde inte de två slutrenderingarna direkt.

## Genomförande

- Det befintliga `tests/export-geometry-parity-browser.mjs` utökas inom samma referenspresentation.
- Chromiums faktiska renderade presentationsbild tas som skärmbild efter att inbäddade bilder har fått möjlighet att avkodas.
- Den redan skapade PDF-filen rasteriseras med `pdftoppm`.
- Båda rasterbilderna normaliseras till referensytan 1600 × 900.
- Fem stabila inre kontrollpunkter används: två rektanglar, en roterad form, en inbäddad bild och en tom bakgrundsyta.
- Maximal avvikelse per färgkanal får vara 22 enheter (0–255). Denna tolerans är avsiktligt begränsad till homogena färgområden, så skillnader i antialiasing längs objektkanter inte ger falska fel.
- Syntaktisk kontroll av browser-testet läggs till före de kostsamma Chromium-körningarna.

## Acceptans

Testet måste köras i den ordinarie automatiska kandidatverifieringen och ge PASS. Det är en mätbar, avgränsad *editor–PDF*-kontroll, inte en fullständig visuell jämförelse av alla pixlar.

## Kända gränser

- Referensfallet omfattar enkla solida former och en opak PNG; det verifierar inte komplex typografi, gradienter, avancerad beskärning, tabeller eller diagram.
- Befintligt separat test för text mäter placering och utbredning av text i PDF.
- PowerPoint/PPTX testas fortsatt för native OOXML-struktur, **inte** visuell återgivning i faktisk Office på Mac eller Windows.
- Manuella releasegrindar kvarstår. Förändringen påverkar inte PPD-formatet eller exportalgoritmen.
