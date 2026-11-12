# UX-05 – Duplicera markerade objekt

## Syfte
Göra det möjligt att snabbt skapa en kopia av ett eller flera markerade objekt, som i PowerPoint, utan en separat kopiera-och-klistra-in-sekvens.

## Beteende
- `Ctrl+D` (Windows/Linux) respektive `Cmd+D` (macOS) duplicerar markerade objekt när tangentbordsfokus inte ligger i ett textfält.
- Objektmenyn erbjuder **Duplicera (Ctrl/Cmd+D)** för motsvarande åtgärd med mus/touch.
- Befintlig kloningslogik återanvänds: nya objekt-, innehålls- och övriga relevanta identiteter skapas, kopiorna förskjuts 24 px i båda riktningar och markeringen flyttas till kopiorna.
- Flera markerade objekt dupliceras tillsammans. En duplicering utgör en ångra-operation.
- Ingen åtgärd utan objektmarkering; inte tillgänglig i skrivskyddat, upptaget eller låst tillstånd.
- Ingen ändring i befintligt urklipp; kod och dokumentformat behålls.

## Verifiering
Enhetstester i `tests/duplicate-selected.test.mjs` kontrollerar kopiering, identitet, geometri, markering, Ångra/Gör om och flerobjektsmarkering. Webbläsartest i `tests/editor-browser.mjs` provar kortkommando och objektmeny inklusive Ångra. Full CI måste passera före merge.
