# Responsiv UX – implementerat beteende och kvarvarande mål

> **Källavstämning 2026-11-12:** Detta dokument skiljer på faktiskt implementerat gränssnitt och ursprungliga UX-krav. Källor: `src/ui/EditorApp.tsx`, `src/ui/editor.css`, `tests/panel-workflow-browser.mjs`, `tests/motion-ribbon-browser.mjs` och `tests/editor-browser.mjs`. Automatiserade Chromium-storlekar är **inte** fysisk Safari-acceptans.

## Implementerad responsivitet

Presentationsbildens logiska geometri ändras inte när webbläsarens storlek ändras. Editorpanelen och visningens skala anpassas i stället. Det finns flera CSS-brytpunkter (`max-width: 1150px`, `900px`, `800px`, `680px` och `520px` samt ett antal kompletterande regler). Därför är de ursprungliga intervallen för dator/tablet/telefon **vägledande designmål**, inte exakta implementerade funktionsgränser.

| Storlek/användning | Implementerat arbetssätt | Belägg och begränsning |
| --- | --- | --- |
| Bred datorvy | Bildpanel, canvas och egenskapspanel kan visas i en gemensam arbetsyta. Egenskaper kan döljas/visas. | `src/ui/EditorApp.tsx`, `tests/panel-workflow-browser.mjs`. |
| Kompakt fönster och stående surfplattestorlek | Panelerna kan väljas genom **Bilder**, **Arbetsyta** och **Egenskaper**; kommandon som kräver en egenskapspanel ska öppna den även om användaren tidigare stängt den. | Samma kod och test, samt `tests/motion-ribbon-browser.mjs`. |
| Smal mobilstorlek | Verktyg och paneler anpassas via samma responsiva modell. | Automatiserade Chromium-prov i bland annat **390×844**, inte garanti för alla mobila webbläsare eller tangentbordslägen. |
| Presentationsläge | Presentationsbilden skalas proportionellt inom tillgänglig yta. | `src/ui/PresentationSlide.tsx`, `tests/motion-ribbon-browser.mjs`. Två skärmar och faktisk Safari återstår. |

Egenskapskommandot för **Övergångar och animeringar** öppnar numera en tidigare dold egenskapspanel genom `openProperties('animations')`. Detta korrigerar det historiska fyndet UX-02-01 i [UX-granskningen](ux-review-sf-next-02.md). Automatiserade tester finns för desktop, emulerad stående iPad och mobil; fysisk iPad-verifiering återstår.

## Fortfarande normativa UX-mål, inte allmänt accepterad funktionalitet

Rotation och iPad Split View ska inte tappa dokument, markering eller pågående text. Ett virtuellt tangentbord får inte täcka viktiga fält och knappar. Textmarkering, dokumentrullning och objektflytt ska vara begripliga och tillgängliga med touch, mus och tangentbord. Det bör finnas tangentbords- eller numeriska alternativ till dragning, och dolda paneler får inte innehålla osynliga tabb-stopp.

Dessa krav kräver manuella prov av verkliga enheter och hjälpmedel före release. Flera kontroller finns i koden, men enbart Chromium-emulering bevisar inte iOS/Safari-beteende eller användbarhet med VoiceOver.

## Utseende och temaseparation

Appen har ett separat ljust/mörkt användargränssnitt, medan presentationens tema lagras i dokumentmodellen. Att välja mörkt appskal ska inte i sig ändra dokumentets färger. Dokumentmallar och visuella referenser har tillkommit sedan den ursprungliga designplaneringen; äldre uppgifter om att en första designpilot ännu inte har gjorts är därför historiska, inte aktuell projektstatus.

För återstående acceptanskrav, se [releasegranskningen](release-review.md). För aktuell användning, se [användarguiden](user-guide.md).
