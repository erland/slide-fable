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

## Gemensam formatering och visuella verktyg

Markera flera objekt och välj Gemensam formatering i egenskapspanelen.
Blandade värden visas när markeringen innehåller olika format. Fyllning, ramfärg,
ramtjocklek, textfärg och textstorlek påverkar olåsta objekt som stöder egenskapen.
Textformat gäller hela objektets text. Grupper genomsöks inte automatiskt.
Varje gemensam ändring kan ångras i ett steg.

Textverktygen erbjuder typsnitt för markerad text. Radavstånd, avstånd före/efter
stycke och indrag gäller styckena som textmarkeringen berör. Fetstil, kursiv och
understrykning visar aktivt läge. Typsnitt måste finnas på enheten; export kan
ersätta dem enligt exportprofilens begränsningar.

Välj en bild och Beskär bild visuellt. Dra motivet i förhandsvisningen eller använd
piltangenterna (Skift ger större steg), och justera Zooma motiv. Tillämpa beskärning
sparar utsnittet; Avbryt beskärning lämnar bilden oförändrad. Ta bort beskärning
återgår till bildens passning cover. Beskärning ersätter inte själva bildresursen.

## Layout- och temagalleri

Välj Design → Layout och tema. Layoutkorten ändrar aktuell bild och bevarar texten.
Saknade textplatshållare tillkommer; objekt utan motsvarighet i den nya layouten
behåller sin placering. Temakorten gäller hela presentationen. Anpassa färger och
typsnitt i samma panel; manuella objektformat behålls. Ändringar kan ångras.

Spara designmall skapar en JSON-fil med temat, masters och deras nödvändiga resurser.
Presentationens egna bilder och talaranteckningar följer inte med. Öppna mallfilen
via Öppna för att börja en ny presentation från dess design. Masterobjekt och
komponenter som ingår i designen följer med i mallen.

## Bildöversikt och återanvändning

Öppna Bildöversikt i bildpanelen. Använd kryssrutorna för flerval eller Skift-klick
på förhandsvisningen för ett intervall. Duplicera, ta bort, dölj/visa eller ändra
gemensam layout för valda bilder. Dra en bild före en annan för att ändra ordning;
flyttknapparna fungerar även med tangentbord och pekskärm. Redigera bild öppnar
bilden i arbetsytan. Gemensamma åtgärder kan ångras i ett steg.

Infoga bilder från fil läser en Slide Fable-HTML eller PPD-JSON och visar dess
bilder för urval. Ingen bild infogas förrän du väljer Infoga valda bilder.
Källans utseende och talaranteckningar följer med; layouterna frikopplas.
Bilderna läggs efter aktuell bild. Olika bildformat passas in proportionellt. Länkar mellan införda bilder behålls; länkar
till bilder som utelämnas tas bort och rapporteras. Resurser med samma namn
skriver inte över presentationens befintliga resurser. Ångra tar bort hela
infogningen och Gör om återställer den.

PPTX-filer stöds ännu inte som källa. Komponenter med bildberoende text avvisas
för att undvika att innehåll ändras. En äldre målversion kan inte ta emot nyare
0.4-objekt. Filer och kombinerade presentationer omfattas av befintliga storleks-
och resursgränser. Bilder från externa resurser behåller sina tidigare begränsningar.
