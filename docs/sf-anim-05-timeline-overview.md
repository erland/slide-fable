# SF-ANIM-05 – tidsöversikt för objektanimationer

Animationspanelen visar nu en läsbar rad med **klicksteg**, **beräknad starttid** och **varaktighet** för varje stödd animation. En diskret tidsstapel visar förhållandet mellan start och varaktighet inom samma klickgrupp. Gruppens längsta sluttid bestämmer skalan; olika klickgrupper jämförs inte med en gemensam absolut tid.

All information härleds från den befintliga `animationSchedule` som även används av presentatören och HTML-exporten. Därför uppdateras tider och grupptillhörighet när startvillkor, fördröjning, varaktighet eller ordning ändras. Animationer som importeras men inte kan spelas upp visas fortsatt med befintligt informationsmeddelande, men får ingen missvisande tidsstapel.

Översikten är informativ, inte en dragbar tidslinjeredigerare. Tider ändras genom de befintliga inmatningsfälten. PPD-format, exportformat och uppspelningssemantik är oförändrade.

Regressionstestet i `tests/motion-ribbon-browser.mjs` kontrollerar grupper och starttider efter ändring av fördröjning och trigger i dator-, iPad- och mobilvy.
