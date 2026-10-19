# Produktgrund – Slide Fable

## Avsikt och styrande underlag
Skapa, redigera, presentera och dela presentationer på telefon, läsplatta och dator.
Läsplatta och dator är primära redigeringsmiljöer. Produktnamnet är Slide Fable;
PPD är filformatets arbetsnamn och PPD Studio i underlaget syftar här på produkten.
Namnet är användarvalt; denna leverans gör ingen varumärkes- eller domänprövning.

Underlagets sex filer finns oförändrade i `reference/`. Funktionell v0.3 §0 gäller
före v0.2 §16–19 och därefter äldre text. Formatspecifikationens v0.3 §0 gäller
före v0.2 §16 och därefter äldre text. Schema/prosa-konflikter dokumenteras och
avgörs i DEV-001; kod får inte tyst bestämma kontraktet.

## Föreslagna produktval
- Lokal behandling utan konto eller obligatorisk server i kärnflödet.
- Svenska gränssnittstexter initialt; produktnamn och interna kontrakt på engelska.
- PWA med full redigering även på telefon via paneler, zoom och numeriska verktyg.
- PPD-HTML är portabelt original med modell, resurser och presentationsruntime.
- Återställningskopia lokalt är ett hjälpmedel; exporterad fil är användarens backup.
- Molnsynk, samarbete, AI-tjänster och PPTX-import kommer efter grundprodukten.

Detta är öppet redovisade standardval, inte påståenden om tidigare godkända beslut.
Inget nytt konto, betalberoende, repository eller extern driftsättning skapas nu.

## Leveransmål
Första körbara delmålet är en vertikal kedja: skapa tre slides, redigera text/form,
spara lokalt, exportera enfil-HTML, öppna offline och återimportera. Det är ett
delmål och får inte kallas komplett MVP. Full MVP omfattar alla M/MVP-krav i
normativ v0.2/v0.3, inklusive master, rik text, diagram, formler och exportinsyn.

## Framgång
En användare kan utan konto skapa en femsidig presentation, återställa efter
omstart, växla enhet genom filöverföring och presentera utan nät. Text, semantik,
objekt-ID:n, bilder och lager överlever HTML-roundtrip. Export begränsar aldrig
redigerbarhet utan objektrapport. Full MVP kräver även faktisk PDF-/Office-granskning.
