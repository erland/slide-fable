# UX-06 – Proportionell storleksändring med Shift

## Syfte
Vid storleksändring med ett objekts handtag ska **Shift** låsa proportionerna, på samma sätt som i vanliga presentationsredigerare.

## Beteende
- Dragning utan Shift följer tidigare beteende, inklusive smarta guider och snäppning.
- Håll Shift medan ett hörnhandtag dras: höjd och bredd förändras med samma faktor och motsatt hörn är fast.
- Håll Shift medan ett sidhandtag dras: proportionerna bevaras, motsatt sida är fast och objektet växer eller krymper centrerat i den andra riktningen.
- Shift under en *storleksändring* utökar inte objektmarkeringen. Shift-klick för flerobjektsmarkering och normal dragning behåller sin tidigare betydelse.
- Under proportionslåsning används inte oberoende snäppning på X/Y; den hade annars kunnat ändra proportionerna. Släpp Shift för att använda vanlig snäppning.
- Proportionell storleksändring har samma beräkning i den omedelbara förhandsvisningen och den sparade objektgeometrin.
- En förändring sparas som en Ångra-operation. Avbrutet drag återställer föregående geometri.
- Gäller objektets storlek; skalar inte själva fontstorleken.

## Verifiering
`tests/geometry.test.mjs` verifierar hörn, sidor, ankarpunkter, bibehållna proportioner och minsta storlek.
`tests/editor-browser.mjs` verifierar Shift-gester för hörn och sida, både förhandsvisning och slutlig geometri samt att markeringen behålls.
Fullständig CI måste vara grön före merge.
