# SF-GAP-03B – lokalt ikonbibliotek

## Användning
Via **Infoga → Ikoner** finns nio originalritade, inbyggda linjeikoner, indelade i IT och verksamhet:
Dator, Databas, Moln, Nätverk, Person, Arbetsgrupp, Säkerhet, Inställningar och Process.

Ikonerna fungerar offline utan extern tjänst, bild-URL eller typsnittsberoende. En ikon infogas som ett vanligt, flyttbart och skalbart PPD `vectorPath`-objekt, med svensk tillgänglighetsbeskrivning. Dess färg/linjebredd kan ändras med befintliga verktyg för objektformat.

## Datakontrakt
Varje ikon är en lokalt definierad SVG-path med `viewBox: "0 0 100 100"`, `closed: false` och `format: "svg-path"`. Den befintliga PPD 0.4.0-strukturen används utan ny formatversion. Renderaren respekterar `closed:false` så att de öppna linjeikonerna inte fylls. SVG-paths valideras av samma PPD-kontrakt som andra vektorer.

Ingen användarinmatad SVG-kod behandlas som körbar HTML. Ikonerna kan klippas ut, kopieras och sparas precis som andra presentationsobjekt.

## Export
PDF och HTML använder redigerarens vektorrendering. PowerPoint-export använder befintlig fallback för `vectorPath` (normalt visuell rasterisering), inte ett native PowerPoint-formobjekt. Formatet är visuellt återgivet men inte fullt redigerbart i PowerPoint, vilket är en explicit avgränsning.

## Testfall
- `tests/icon-catalog.test.mjs`: katalogens identiteter, vektorformat och avvisning av okända ikon-ID.
- `tests/insert-gallery-browser.mjs`: infogning, SVG-form, tillgänglighet och fullständig PPD-validering i Chromium desktop, stående iPad och telefon.
- Befintliga export-, PWA-, PPD- och säkerhetstester i GitHub Actions kandidatflöde.

## Kvarstående
Utökat ikonurval, kategorisökning, märkes-/produktlogotyper, färgteman, och native redigerbara PPTX-vektorikoner ingår inte.
