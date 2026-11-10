# SF-ANIM-09 – gruppering av animationer efter klicksteg

## Syfte

När en bild har många animationer ska det vara tydligt vilka som kräver ett eget klick och vilka som spelas tillsammans. Tidigare låg allt i en enda lista och klickgruppens nummer syntes bara i tidsinformationen.

## Förändring

- Varje ny klickgrupp får en tydlig rubrik: **Klicksteg N**, antal animationer och gruppens längsta sluttid.
- Varje animation märks med hur den startas: **Vid klick**, **Med föregående** eller **Efter föregående**.
- Gruppering och grupptid räknas från `animationSchedule`, samma källa som används vid uppspelning. Grupperna ändras direkt när användaren byter startvillkor eller ordning.
- Importerade effekter som inte spelas upp markeras som sådana i en egen visuell sektion, utan att felaktigt tillskrivas ett klicksteg.
- Listans befintliga ordning, individuella kontroller, tidsdragning, uppspelning och dokumentformat påverkas inte.

## Regression

`tests/motion-ribbon-browser.mjs` kontrollerar att två klickstartade animationer visas som två grupper, samt att byte till **Med föregående** ger en enda grupp med två animationer. Kontroll sker för desktop, iPad-porträtt och mobil.

## Avgränsning

Detta steg förbättrar gruppering och begriplighet men inför inte hopfällbara grupper eller drag-och-släpp-omordning. De befintliga upp-/nedknapparna för ordning behålls.
