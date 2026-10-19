# Använd Slide Fable 0.5

Starta den färdigbyggda appen från projektroten:

```sh
python -m http.server 8000 --directory preview
```

Öppna http://localhost:8000. För telefon och läsplatta på en annan enhet behövs
statisk HTTPS-hosting för installation och offlinefunktion. Öppna appen med nät
första gången och invänta ”redo för offline”. Den här leveransen har ingen vald
extern hosting eller serverdel.

## Skapa och redigera

Lägg till bilder med plusknappen i bildpanelen. På mindre skärmar växlar du mellan
Bilder, Arbetsyta och Egenskaper. Infoga text, former, linjer, tabell, diagram,
process, formel, vektor eller en bildfil från verktygsraden.

Markera ett objekt, dra för att flytta och dra hörnhandtaget för storlek.
Geometrifälten anger position, storlek och rotation i dokumentets logiska enheter.
Skift ger flerval. Piltangenter flyttar markeringen; Skift ökar steget. Alt under
förflyttning förbikopplar rutnätet. Förstoring och rullning används för större bilder.
Lagerlistan gör även överlappande objekt åtkomliga.

Textredigeraren i objektpanelen har fetstil, kursiv, understrykning, listor,
listnivåer, länkar, justering, storlek och färg. Tabeller har cellinmatning,
sammanfogning åt höger, rubrikceller och tillägg av rader/kolumner. Diagram har
datatabell. Processdiagram har nodtext och riktning. LaTeX/MathML och vektorbanor
bevaras som redigeringskälla.

Bilders passning, mask, fokus och beskärning finns i objektpanelen. Ersätt bild
behåller objektets geometri och befintlig beskärning/fokus. Ange alternativtext.
En del avancerade egenskaper, exempelvis masterobjekt, effekter, tabellspann,
relationer och komponentdefinitioner, redigeras som JSON med validering. Det är
ett tekniskt gränssnitt i denna utvecklingsversion.

Under Design väljer du layout, återställer lokala layoutavvikelser och redigerar
tema/master. En frikopplad layout behåller den aktuella objektgeometrin. Skapa
komponent från markeringen och infoga instanser från dokumentets bibliotek.
Bildpanelen innehåller duplicering, borttagning och ordning. Bildfliken innehåller
sektioner, läsordning, fragment och sök/ersätt.

## Spara och återställ

Spara HTML skapar en ensam flyttbar presentation med redigeringsmodell, resurser,
typsnitt och visningsläge. Öppna filen direkt för visning, eller välj Öppna i appen
för fortsatt redigering. Webbläsaren bestämmer var nedladdningar hamnar.

Arbetskopian sparas automatiskt i webbläsaren på denna enhet. Vid omstart väljer
du uttryckligen om en arbetskopia ska återställas. En annan flik får aldrig skriva
över en nyare arbetskopia utan konfliktmeddelande. Skapa då en separat kopia eller
hämta din HTML-fil. Arbetskopian ersätter inte en nedladdad säkerhetskopia och kan
försvinna om webbläsarens data rensas. Sparandet kan misslyckas vid lagringsbrist;
statusraden visar detta.

Ctrl/Cmd+S skapar HTML, Ctrl/Cmd+Z ångrar, Ctrl/Cmd+Skift+Z gör om och
Ctrl/Cmd+C/V kopierar objekt inom appen. Kopieringen använder appens eget
klippbord. Spara HTML innan du öppnar en annan presentation.

## Presentera och exportera

Presentera öppnar aktuell bild med anteckningar och timer. Publikfönster öppnar
ett separat fönster utan talaranteckningar i dess överförda modell. Tillåt popup
om webbläsaren blockerar fönstret. Pilar och mellanslag byter bild/fragment,
B ger svart skärm och Esc avslutar. Helskärm beror på webbläsarens stöd.
Använd en presentation åt gången per webbplats i denna version.

Exportera ger HTML, PDF, PPTX eller en ZIP med PNG/JPG. PDF och PPTX erbjuder
redigerbarhet först, visuellt först med separat huvudtext eller platt sida.
Välj aktuell bild eller alla synliga bilder för PDF/PPTX/bilder. Varje export ger
en JSON-rapport med status per objekt och varningar. Läs rapporten innan filen
används vidare. PPTX bäddar inte in typsnitt. PDF bäddar in DejaVu Sans.

HTML innehåller även dolda objekt och hela redigeringsmodellen. Avmarkera privata
uppgifter för att ta bort talaranteckningar/proveniens ur en delningskopia.
PDF/PPTX-källbilagan avser diagram-/formelkällor; den innehåller inga
speakerNotes. Funktionen är ingen generell sekretessgranskning av innehållet.

## Begränsningar

Detta är en verifieringsversion, inte en godkänd MVP-release. Läs
`docs/release-review.md` för gränser, kvarvarande krav och miljöprov som saknas.
