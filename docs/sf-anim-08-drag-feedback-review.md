# SF-ANIM-08 – användbarhetsgranskning och bättre återkoppling vid dragning

## Granskning

En riktad genomgång av animationspanelen efter SF-ANIM-07 bekräftar att följande huvudflöden finns: lägga till och ordna animationer, ändra trigger/fördröjning/varaktighet, ändra flygriktning, förhandsvisa animationer i redigeraren och dra tidsstaplar för timing. Uppspelningens klickgrupper beräknas i `animationSchedule`.

Den viktigaste identifierade användbarhetsbristen var att själva stapeln rörde sig vid dragning medan texten om starttid och varaktighet stod kvar på sparade värden. Det gjorde det svårt att bedöma ett pågående drag, framför allt på smal skärm.

## Förbättring

- Visar **beräknad starttid och varaktighet** under dragning, med texten ”Justerar” och ”släpp för att spara”.
- Markerar tidslinjen visuellt så länge användaren drar.
- Vid avslutad dragning återgår komponenten till att visa sparade värden från uppspelningsschemat.
- Vid `pointercancel` försvinner den tillfälliga visningen och ingen dokumentändring sparas.
- Fortsätter använda ett enda dokumentkommando per avslutad dragning. Befintliga tangentbordsvänliga fält och snabbknappar finns kvar.

## Regression och kvarvarande frågor

`tests/motion-ribbon-browser.mjs` kontrollerar live-text, aktiv förhandsvisning, avslutad dragning och avbruten pekarinteraktion över dator-, iPad- och mobilstorlek.

Den riktade granskningen är inte en fullständig användbarhetsutvärdering med verkliga testpersoner eller riktig iPad-hårdvara. Vidare prioriteringar kan vara bättre visualisering av sekvenser med många animationer, tydligare skillnad mellan relativ fördröjning och faktisk starttid samt pekar-/tangentbordsprov på fysiska enheter. Inga nya animationseffekter eller schemaändringar ingår.
