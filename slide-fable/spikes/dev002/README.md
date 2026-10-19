# DEV-002 – körbara teknikprov

Detta är ett separat experiment, inte Slide Fables färdiga editor eller PWA-skal.
Tre PPD-bilder används för gemensam DOM-textmätning och lokala PDF/PPTX-exporter.
Nedladdningar, typsnitt och exporter fungerar utan nät efter att HTML-filen byggts.

## Kör
Node 22 eller senare och Python 3.12 rekommenderas. På Windows körs Python med
python eller py enligt installation; npm-skripten är plattformsneutrala.

1. Installera Python-beroenden från projektroten: `python -m pip install -r requirements-dev002.txt`.
2. Kör npm ci i denna katalog. package-lock.json låser direkta och transitiva beroenden.
3. Installera browsermiljö: `npx playwright install --with-deps chromium webkit`.
4. Kör från projektroten: `python scripts/verify_dev002.py`.

Provets byggfil ligger därefter i generated/index.html. Den kan öppnas som lokal
fil utan server. Förbyggt prov samt en PDF och PPTX finns också under examples/dev002.
Ingen publicering eller kontoanslutning behövs.

## Browsermiljö
Verifieraren använder i första hand Playwrights Chromium. CHROMIUM_EXECUTABLE kan
peka på ett redan installerat Chromium. I denna miljö användes Chromium 153.0.8010.0
från den låsta @sparticuz/chromium-distributionen efter att ordinarie CDN-hämtning
misslyckats. Den serverlösa reservdistributionens standarduppackning kunde inte
ändra ägare på filer i miljön; den packades upp separat utan ägarbyte och användes
via CHROMIUM_EXECUTABLE. Detta är en testmiljöanpassning, inte en appfunktion.
SPIKE_OUTPUT kan styra tillfällig evidenskatalog. Browserbinärer och node_modules
ingår inte i projekt-ZIP:en.

## Vad provet visar
- DOM/SVG som utgångspunkt med uppmätta rader och delat displayunderlag.
- Tiptap/ProseMirror för paragraph/run-redigering med bevarade PPD-ID:n och formatering.
- pdf-lib/fontkit för klientlokal sökbar text och inbäddade typsnitt.
- PptxGenJS för OOXML-text, form, tabell och separat effektbild.
- DOMPurify plus typad kontroll för SVG/MathML; KaTeX utan betrodda makron.

## Vad provet inte visar
Sökbar PDF är bevisad i Chromium, inte på faktisk iPad. Automatiserad WebKit saknar
systemberoenden i denna körmiljö och är deferred; ingen lyckad Safari-test påstås.
Mobil-/tabletmått är Chromium-emulering, inte test på fysisk enhet. PowerPoint har
inte öppnats; XML-struktur kan inte ersätta faktisk redigering där. PDF-bilderna är
visuellt granskade men exporten är inte en generell motor ännu.

Glasbilden är en uttryckligen förenklad canvasfallback med gradient/panel. Den
återskapar inte generell backdrop-blur, skuggor eller valfria bakgrunder exakt.
Rik-textbryggan provar paragraph/runs, fetstil och länk. Listor, styckeegenskaper,
IME, komplexa skriftsystem och full run-formattering behöver senare integration.
PPTX-typsnitt är inte inbäddade; mottagaren kan få substitution. PDF-fonterna är
inbäddade. Exempeldata är tekniska testfall, inte designreferens för den färdiga produkten.
