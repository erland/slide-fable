# UX-steg 5 – tangentbordsstyrd objektplacering

## Ändring
- Piltangenter flyttar hela den markerade uppsättningen i ett atomiskt, ångringsbart steg.
- Skift + piltangent flyttar tio dokumentenheter; vanlig piltangent flyttar en.
- Låsta objekt lämnas oförändrade och en markering med bara låsta objekt ger ingen historikpost.
- Geometriändringar av layoutbundna platshållare registreras som overrides.
- Ctrl/Cmd + G grupperar minst två markerade objekt; Ctrl/Cmd + Skift + G avgrupperar markerad grupp.
- En genvägshint finns i objektpanelen.

## Verifiering
- `npm run build`
- `node --experimental-strip-types --test tests/arrange.test.mjs`
- `npm test` (förutsätter Playwright-webbläsare)
- Kontrollera manuell interaktion på dator med två markerade objekt, ett låst objekt och ångra.

## Avgränsning
Inga ändringar i PPD-schema, export eller layoutmotor. Befintliga smarta hjälplinjer och justeringskommandon återanvänds oförändrade.
