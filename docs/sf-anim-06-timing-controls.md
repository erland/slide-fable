# SF-ANIM-06 – direkt justering av animationernas timing

I animationspanelens tidsöversikt finns nu knappar för **fördröjning −100/+100 ms** och **varaktighet −100/+100 ms**. Varje klick uppdaterar samma PPD-egenskaper som de befintliga numeriska fälten, med begränsning till 0–60 000 ms. Det går att använda kontrollerna med mus, tangentbord och pekskärm, och varje justering kan ångras separat.

Tidsstapeln och uppspelningen fortsätter att utgå från `animationSchedule`. Vid `with-previous` och `after-previous` kan den beräknade starttiden därför skilja sig från själva fördröjningen; den visas fortsatt enligt det faktiska schemat. Varaktighet kan inte justeras via snabbknapparna för `appear` eftersom den effekten är momentan och dess `durationMs` inte påverkar uppspelningens längd.

Det här steget ger direktredigering via knappar vid tidsöversikten, **inte** dragning av staplar. Mer avancerad mus-/touchdragning kan införas separat efter att vi har ett granskat upplägg för skalning, snäppning, min-/maxvärden och undo.

Regressionstester i `tests/motion-ribbon-browser.mjs` granskar fördröjning, varaktighet, live-uppdaterad tidslinje och ångra/gör om på desktop, iPad-porträtt och mobil. PPD 0.4-formatet och exporterna ändras inte.
