# Responsiv UX

Presentationsbildens logiska geometri ändras inte med skärmen. Det är verktygens
paneler som anpassas. Presentationen skalas proportionellt och får letterbox.

| Miljö | Arbetsyta | Interaktion |
|---|---|---|
| Dator, normalt ≥1200 px | Miniatyrer, mittcanvas, egenskapspanel | Mus, kortkommandon, flerval, exakta numeriska fält |
| Tablet/kompakt dator, normalt 768–1199 px | Canvas prioriteras, en sidopanel åt gången | Touch, penna som pekare, tangentbord om anslutet |
| Telefon, normalt <768 px | Canvas plus verktygsfält och expanderbar bottenpanel | Textredigering i fokuserad panel, valbar precisionsvy, bildlista separat |

Brytpunkter är designstartvärden; faktisk tillgänglig yta och inputkapacitet styr.
Rotation och iPad split view får inte tappa dokument, urval eller pågående text.
Virtuellt tangentbord får inte täcka aktivt textfält eller Spara/Stäng.
Textmarkering, sidscroll och objektflytt har separata lägen; tvåfingerspan/zoom
får inte blockera webbläsarens tillgänglighetszoom. Drag har alltid knappar eller
numeriskt alternativ. Dolda paneler får inte lämna osynliga tabb-stopp.

Neutral, lugn editor med ljus/mörkt appskal; dokumentets tema är oberoende av
systemets mörka läge. En mörk editor får inte byta färger i presentationsfilen.
Ingen bildreferens är bifogad; första designpilot ska därför visa titelbild,
innehåll med glaspanel och process/diagram före visuell baslinje fastställs.
