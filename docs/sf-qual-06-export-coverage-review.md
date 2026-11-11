# SF-QUAL-06 – täckningsgranskning av presentationsexport

**Omfattning:** aktuell `main` efter PR #146. **Underlag:** `docs/export-coverage.json`, exporttesterna och `docs/release-gates.json`.

## Slutsats

Slide Fable har betydande **automatiserad strukturell verifiering** för PDF och PPTX. De senaste PR:erna #144–146 har stärkt kontrollen av bildurval, färgytor och kombinationen text/bakgrund. Detta innebär **inte** att det finns fullt visuellt jämförbara PDF- och PowerPoint-filer för alla typer av presentationer.

Särskilt viktigt är att skilja på:
1. **PPD/OOXML-struktur** – rätt objekt, positioner och data i den genererade filen.
2. **Visuell delkontroll** – ett begränsat antal kontrollerade pixlar och textmått i redigerare jämfört med rasteriserad PDF.
3. **Mottagarmiljö** – verklig öppning, redigering och sparning i PowerPoint Mac/Windows respektive fristående PDF-läsare.

De första två finns i varierande omfattning. Den tredje är fortfarande öppen.

## Täckningsbild

| Område | Befintligt bevis | Viktigaste återstående lucka |
|---|---|---|
| Bildurval/dolda bilder | Automatiskt PDF-sidantal och PPTX-bilddelar | Fullständig exportdialog för olika profiler/urval |
| Position, rotation, bildobjekt | PPD/editor-bounds, native PPTX-geometri och PDF-raster | Office-rendering, flera crop-/masktyper |
| Färger och bakgrund | Fem kontrollpunkter och text på färgad form | Mörk bakgrund, gradienter, foto och transparens |
| Rik text/ÅÄÖ | Textfragment, fontstorlek i PPTX och PDF-inkmått | Unicode, typsnittsersättning, avancerade listor och Office-radbrytning |
| Tabeller | Native OOXML, celler och färg, PDF-förekomst | Redigera/spara i Office, komplexa spann |
| Stapel-/linje-/cirkeldiagram | Diagram-XML, kategorier och värden | Dataserier efter redigering i Office, visuellt utseende |
| Ikoner och vektorer | Native PPTX-former, fallback | PowerPoint/Keynote-visning och ändringsbarhet |
| HTML och arbetskopior | Spara/spara som, dokumentlivscykel | Mobil Safari och extern delning |
| JPG/PNG och profiler | Formatstöd i kod, delar av automatiseringen | Komplett format-/profilmatris, visuella och loss-report-bevis |

Detaljer, exakta bevisfiler, prioritet och koppling till releasegrindar finns i den maskinläsbara **`docs/export-coverage.json`**.

## Rekommenderad ordning

### 1. RG-006 / EXP-11 – verklig PowerPoint-rundtur (P0)

Skapa en liten, **fast referenspresentation** med blandad svensk text, färgad form, en beskuren bild, en sammanslagen tabell och stapel-/linje-/cirkeldiagram. Exportera PPTX från Slide Fable och öppna i **PowerPoint för Mac och Windows**. Kontrollera filreparation, visuellt utseende, om objekten är separat redigerbara samt att ändring och omsparning fungerar. Dokumentera avvikelser per objekt, med skärmbild och PPTX-version. CI/OOXML-kontroller ersätter inte detta prov.

**Avslutskriterium:** faktisk evidens från båda Office-miljöerna och tydlig felklassificering; inte bara en grön CI-körning.

### 2. RG-008 / EXP-12 – PDF i oberoende läsare (P0)

Öppna samma PDF i **Preview och/eller Adobe Acrobat**. Kontrollera sidantal, beskärning, ÅÄÖ, sökbar/markerbar text, tabeller och bilder. Jämför med redigeraren. Spara evidens och avvikelser.

### 3. RG-007 / EXP-13 – representativ visuell testkorpus (P1)

Bygg därefter fyra stabila referensfiler: ljus standard, mörkt tema, foto/transparens och diagramtung med flera bilder. Ta editor-, PDF- och där möjligt PowerPoint-renderingar med specificerade toleranser och manuella granskningar.

### 4. EXP-10 och EXP-14 – bildbeskärning, exportprofiler och förlustrapport (P1)

Komplettera automatiska regressioner för crop/mask, visual-first/editable-first/flattened, PNG/JPG och deklarerad rasterfallback. Varje kontroll ska skilja på **filens tekniska struktur** och **mottagarens visuella resultat**.

## Beslutsgräns och ansvarsfull status

- Befintliga bevisfiler är **täckningskällor**, inte ett påstående om att en specifik körning har passerat.
- Varje scenario har en **uttrycklig återstående begränsning**.
- `manual_pending` är aldrig `PASS`; ingen manuell attest uppstår genom att matrisen skapas.
- `RG-005–010` och historisk migration `RG-009` omfattar även sådant som ligger utanför detta exportsteg.
- **Releasebedömningen förblir `NOT_READY`.** Ändra den först när verkliga releasegrindar är verifierade.

## Varför detta steg inte ändrar exportmotorn

Exportkoden är redan försedd med flera specialiserade regressionstester. Nästa största osäkerhet gäller *verklig användning av exporterade filer*, inte en ytterligare snäv kodkontroll. Den här granskningen prioriterar sådant som faktiskt minskar risken för en undermålig första release.

**Rekommenderat nästa genomförandesteg:** framställ ett upprepningsbart referenspaket (PPD, PDF, PPTX och kontrollprotokoll) som kan öppnas på Mac och Windows utan att på förhand markera resultat som godkänt.
