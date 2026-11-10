# SF-ANIM-07 – dra animationsstaplar

Animationspanelen stöder nu pekarbaserad justering av timing direkt på tidsstapeln:

- Dra **stapelns kropp** horisontellt för att ändra animationens `delayMs` (fördröjning).
- Dra **handtaget i högra kanten** för att ändra `durationMs` (varaktighet).
- Värden snäpps till 50 ms, begränsas till 0–60 000 ms och visas under dragningen.
- Förhandsvisningen under dragning sparas inte i dokumentet. När dragningen avslutas skrivs en enda transaktion, som kan ångras/göras om. Avbruten pekinteraktion sparas inte.
- Skalningen har minst 1 000 ms räckvidd och bygger annars på klickgruppens längd. Det är en relativ tidslinje per klicksteg, inte en global presentationstid.
- Momentana `appear`-effekter kan inte ändras i varaktighet genom handtaget. De befintliga inmatningsfälten och ±100 ms-knapparna finns kvar för tangentbordsanvändning och exakta justeringar.

Den beräknade starttiden bygger fortfarande på `animationSchedule`. För `with-previous` och `after-previous` representerar dragningen förändrad *fördröjning*, inte ett oberoende absolut startvärde.

Regressionstestet i `tests/motion-ribbon-browser.mjs` kontrollerar dra-fördröjning, dra-varaktighet, att inget skrivs före släpp och ångra/gör om för dator-, iPad- och mobilstorlek. PPD-format och exporter är oförändrade.
