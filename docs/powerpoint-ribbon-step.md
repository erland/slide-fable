# PowerPoint-liknande meny – steg 2

## Avgränsning
Detta steg ändrar endast navigeringen till befintliga kommandon. Ingen ändring i PPD-kontrakt, lagring eller export.

- **Start** är standardflik när redigeraren öppnas, med **Ny bild**, **Kopiera**, **Klistra in**, **Ångra**, **Gör om** och **Layout** i det övre verktygsfältet.
- **Arkiv** är en tydlig ingång för Ny, Öppna, Spara HTML, Exportera och Hjälp (befintliga funktioner).
- När ett objekt markeras visas den kontextberoende fliken **Formatera**. Där finns **Kopiera objekt**, **Visa formatering** och fler objektval. När markeringen försvinner lämnas fliken automatiskt om den är aktiv.
- **Layout** öppnar designinställningarna utan att skapa en parallell modell för formatering.
- På små skärmar används befintlig horisontell fliknavigering.

## Kontrollpunkter
1. Första öppningen: Start markerad och Arkiv i sidhuvudet.
2. Start: Ny bild, Kopiera/Klistra in, Ångra/Gör om och Layout nåbara med tangentbord.
3. Markera text eller form: Formatera visas. Klicka Visa formatering: rätt egenskapspanel öppnas.
4. Avmarkera: Formatera försvinner och Start väljs om Formatera var aktiv.
5. Dator 1440×900, iPad 820×1180 / 1180×820 och mobil 390×844: ingen förlorad navigering eller horisontell sidscroll.
6. `npm run build`, `npm run lint`, `npm test`, `npm run test:editor` (med korrekt Playwright-browser installerad).

Detta är ett avgränsat steg. Komplett PowerPoint-lik textformatering, genvägar och menysamordning ingår i senare steg.
