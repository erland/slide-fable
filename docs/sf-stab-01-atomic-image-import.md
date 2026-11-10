# SF-STAB-01 – stabilare asynkron bildimport

## Identifierat problem

Bildimporten skapade tidigare en kopia av hela dokumentet före asynkron läsning, kontrollsummering och avkodning. Efter valideringen skrevs dokumentets hela `assets`-samling och `slides`-samling tillbaka. Om en användare hann ändra något under tiden kunde ändringarna skrivas över.

## Åtgärd

- Fångar avsedd bild och bild-ID vid start, innan asynkrona operationer.
- Läser, avkodar och validerar innehållet först.
- Lägger sedan till **endast** den nya bildresursen och dess objektändring i en transaktion mot den aktuella dokumentversionen.
- Avbryter med fel om målbilden eller bilden som skulle ersättas har försvunnit under importen, i stället för att skapa en oavsiktlig dubblett.
- Återställer ersättningsläget direkt vid start för att inte läcka över till ett efterföljande importkommando.

## Regression

`tests/panel-workflow-browser.mjs` testar fortsatt bildbyte på dator, surfplatta och mobil. Ett nytt test med fördröjd `FileReader` utför dessutom en annan redigering medan importen väntar och verifierar att båda objektändringarna bevaras.

## Avgränsning

Ingen ändring av PPD-formatet, exportformat, animationsfunktioner eller service worker. Detta steg eliminerar en identifierad risk med föråldrade dokumentsnapshots men ersätter inte en längre stabilitetsgranskning av alla asynkrona arbetsflöden.

Merga först när den nya GitHub Actions-körningen är grön.
