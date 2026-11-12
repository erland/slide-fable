# Använd Slide Fable 0.5

Starta utvecklingsversionen från projektroten med **Node.js 22.16.0 eller senare**:

```sh
npm ci
npm run dev
```

Öppna adressen som Vite visar. För att förhandsgranska den byggda produktionsversionen kör du `npm run build` följt av `npm run preview`. Om en färdig `preview/`-katalog finns i distributionen kan den också serveras med `python -m http.server 8000 --directory preview`. För telefon och läsplatta på en annan enhet behövs
statisk HTTPS-hosting för installation och offlinefunktion. Öppna appen med nät
första gången och invänta ”redo för offline”. Den här appen har ingen serverdel för dokumentlagring. En GitHub Pages-
publicering är konfigurerad via Actions, men kontrollera att den faktiskt lyckats
innan du förlitar dig på den för installation och offlineanvändning.

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
listnivåer, länkar, justering, storlek och färg. Tabeller och diagram har även
särskilda redigeringsverktyg (se nedan). Processdiagram har nodtext och riktning.
LaTeX/MathML och vektorbanor bevaras som redigeringskälla.

Bilders passning, mask, fokus och beskärning finns i objektpanelen. Ersätt bild
behåller objektets geometri och befintlig beskärning/fokus. Ange alternativtext.
En del avancerade egenskaper, exempelvis vissa masterobjekt, relationer och
komponentdefinitioner, kräver fortfarande JSON-redigering med validering.
**Enkla tabellsammanslagningar/-delningar och animeringar har däremot visuella
verktyg.** JSON-gränssnittet är ett tekniskt komplement i denna utvecklingsversion.

Under Design väljer du layout, återställer lokala layoutavvikelser och redigerar
tema/master. En frikopplad layout behåller den aktuella objektgeometrin. Skapa
komponent från markeringen och infoga instanser från dokumentets bibliotek.
Bildpanelen innehåller duplicering, borttagning och ordning. Bildfliken innehåller
sektioner, läsordning, fragment och sök/ersätt.

## Tabeller och diagram utan JSON

Infoga en tabell med **Infoga → Tabell**, eller markera en befintlig tabell.
Under **Start → Tabellverktyg → Redigera tabell** kan du öppna cellredigering
direkt i verktygsfältet. Välj **Fler egenskaper** för hela tabellredigeraren.

- Ändra celltext och markera en cell som rubrikcell med **Rubrikcell**.
- Använd **Sammanfoga →** för att slå samman cellen med grannen till höger.
  Textinnehållet i båda cellerna kombineras i den sammanslagna cellen.
- Välj **Dela cell** på en horisontellt sammanslagen cell för att dela upp den
  igen. Ursprungscellen behåller sitt textinnehåll; tillkommande celler är tomma.
  Detta återställer inte automatiskt den text som fanns i granncellerna före
  sammanfogningen – använd **Ångra** om du vill återfå exakt ursprungsläge.
- **Dela cell** är avsiktligt avaktiverad för vertikala spann eller
  inkonsekvent rutnätsbredd. Det är inte ett generellt verktyg för alla
  komplexa rad- och kolumnspann.
- Lägg till rader/kolumner, ändra kolumnbredder, cellmarginaler och individuella
  cellkantlinjer. **Flytta sista kolumnen först** är spärrad när celler har spann.

Infoga ett diagram med **Infoga → Diagram** eller markera ett befintligt.
Använd **Formatera → Diagramverktyg → Redigera diagramdata** för att ändra
innehållet utan JSON, eller **Fler egenskaper** för diagramredigeraren.

- Välj diagramtyp bland de stödda **stapel-, linje- och cirkeldiagrammen**.
- Redigera **serienamn**, **kategorinamn** och **numeriska värden**.
- Använd **Ny serie** och **Ny kategori** för att lägga till data.
- Använd **Ta bort serie/kategori** och **Uppåt/Nedåt** för att ta bort eller
  ändra ordningen. Minst en serie och kategori måste finnas kvar.
- När en kategori flyttas eller tas bort följer värdena i alla serier med
  samma kategori, så att dataserierna förblir synkroniserade.
- Ändringar i tabeller och diagram är ångringsbara via redigerarens
  vanliga historik.

Funktionerna ovan beskriver den implementerade redigeraren och dess
automatiserade Chromium-regressionstester. Det är **inte** en garanti för att
alla tabellspann, diagramformat eller exportvarianter fungerar identiskt i
PowerPoint på Mac/Windows. Se `docs/release-review.md`.

## Paneler och bildersättning

På större skärmar kan du visa eller dölja **Egenskaper**. På smalare skärmar
växlar du via **Bilder**, **Arbetsyta** och **Egenskaper**. En markerad form
behåller sin markering vid vanligt panelbyte. Om du stänger egenskapspanelen
återgår vyn till arbetsytan; panelen kan öppnas igen.

För en markerad bild finns **Ersätt bild** under formatering/egenskaper.
Det valda bildobjektet behålls med sin geometri medan själva bildresursen
byts. **Infoga → Bilder** är däremot avsett för ett *nytt* bildobjekt.
Bildersättning och panelväxling testas automatiskt på desktop, stående iPad-
storlek och mobilstorlek; dessa tester ersätter inte ett fysiskt Safari-test.

## Spara och återställ

Spara HTML skapar en ensam flyttbar presentation med redigeringsmodell, resurser,
typsnitt och visningsläge. Öppna filen direkt för visning, eller välj Öppna i appen
för fortsatt redigering. Webbläsaren bestämmer var nedladdningar hamnar.

Arbetskopian sparas automatiskt i webbläsaren på denna enhet. För att öppna en
sparad version väljer du **Arkiv → Arbetskopior…**. Dialogen visar lokala
presentationer med titel och senast sparad tid. Välj **Öppna** och bekräfta
innan den sparade presentationen ersätter den öppna. Du kan också välja
**Ta bort**, med separat bekräftelse. Två arbetskopior kan ha samma titel;
de är separata dokument med olika identiteter. Dialogen visas inte automatiskt
som en panel över redigeringsytan. En annan flik får aldrig skriva
över en nyare arbetskopia utan konfliktmeddelande. Skapa då en separat kopia eller
hämta din HTML-fil. Arbetskopian ersätter inte en nedladdad säkerhetskopia och kan
försvinna om webbläsarens data rensas. Sparandet kan misslyckas vid lagringsbrist;
statusraden visar detta.

**Ångra** går tillbaka i ändringshistoriken för den aktuella redigeringen,
medan **Arbetskopior** återställer en helt sparad presentation efter ett
uttryckligt val. Återställning ersätter arbetsytan och kan **inte** ångras med
Ångra. Hämta gärna den öppna presentationen som HTML innan du återställer.

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
Saknade textplatshållare tillkommer vid det första behovet. Layoutstyrda
textobjekt som tillfälligt kopplats loss återanvänds vid senare byten mellan
exempelvis **Innehåll** och **Två kolumner**, i stället för att nya skapas varje
gång. Objekt utan motsvarighet behåller sitt innehåll och sin placering;
fristående objekt som användaren själv infogat tas inte över som platshållare.
Objekt som redan blivit duplicerade i äldre versioner raderas inte automatiskt. Temakorten gäller hela presentationen. Anpassa färger och
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


### Enkla övergångar och animeringar

Öppna **Visa → Övergångar och animeringar**. Välj Ingen eller Toning för aktuell
bild och ställ in övergångstiden. Markera ett objekt och välj Visa, Tona in, Försvinn, Flyg in eller Flyg ut. För flyg-effekter kan du välja riktning i egenskapspanelen. Markera ett textobjekt med minst två punkter och välj **Punkter stegvis** för att visa en punkt per klick. Listan visar uppspelningsordningen och låter dig flytta eller ta bort
effekter. Varje ändring kan ångras. Objektanimeringar kräver PPD 0.4.

Vid klick startar nästa steg. Med föregående räknas från föregående start,
Efter föregående från föregående slut; fördröjningen läggs till detta. En första
automatisk effekt startar när bilden öppnas. Använd förhandsvisningsknappen för
att börja på aktuell bild. Nästa/pil/mellanslag spelar nästa steg innan bildbyte;
Föregående återställer ett steg. Befintliga fragment delar samma stegnummer.
Minskad rörelse visar effekternas slutlägen direkt. Esc avslutar i appen.

Samma uppspelning, inklusive flyg-effekter och stegvisa punktlistor, följer med fristående HTML och fungerar utan nätverk.
HTML behåller hela PPD-modellen. PDF, PowerPoint och bildexport visar statiska
bilder med alla synliga objekt; animeringar exporteras inte till Office.
Importerade avancerade effekter bevaras i modellen och visas i listan, men spelas
inte. Media och en avancerad animationstidslinje ingår inte i denna version.
