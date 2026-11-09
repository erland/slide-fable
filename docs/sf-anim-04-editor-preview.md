# SF-ANIM-04 – förhandsvisa animationer i redigeraren

Knappen **Förhandsvisa från aktuell bild** i egenskapspanelen och motsvarande **Förhandsvisa** i animations-/övergångsribbon öppnar nu en avgränsad överlagrad förhandsvisning, utan att starta bildspelets presentatörsläge. Redigerarens dokument, markering och aktuella bild ändras inte.

Förhandsvisningen använder samma `PresentationSlide` och `applyPlayback` som bildspelet. Den öppnas på steg 0 och visar knappar för nästa/föregående animationssteg, börja om samt stäng. När den stängs återgår användaren till redigeraren. Återspelning, avbrutna animationer och *prefers-reduced-motion* följer den befintliga uppspelningsmotorn.

En responsiv dialog begränsar förhandsvisningen på desktop, surfplatta och telefon. Förhandsvisningen är läsbar, inte redigerbar, och stöder inte bildnavigering; för att testa hela presentationen används fortsatt **Bildspel**.

Regressionstest: `tests/motion-ribbon-browser.mjs` kontrollerar öppning, framåt/bakåt, stängning, att ingen presentatör öppnas, samt att dokumentmodellen är oförändrad i desktop, iPad-porträtt och mobil.
