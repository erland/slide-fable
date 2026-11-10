# SF-ANIM-10 – hopfällbara klickgrupper

## Mål

En bild med många animationer ska kunna överblickas utan att varje animations detaljer tar upp plats. Klickgrupperna från SF-ANIM-09 är därför nu hopfällbara.

## Beteende

- Varje klicksteg har en fokuserbar knapp med synlig rubrik, pil och `aria-expanded`.
- Ett stängt klicksteg visar fortfarande antal animationer och gruppens totala uppspelningstid.
- Animationernas redigeringskontroller och tidsstaplar döljs tills gruppen öppnas igen.
- Alla grupper är **öppna från början**. Att fälla ihop eller öppna är en ren visningsinställning, utan ändring i PPD eller ångrahistoriken.
- Vilka animationer som hör ihop härleds från samma `animationSchedule` som används i uppspelningen.
- Gruppens öppet/stängt-läge knyts till ID för den första schemalagda animationen i respektive grupp i stället för till gruppnumret. Det minskar risken att en omnumrering av klicksteg stänger fel grupp.
- Äldre importerade effekter som inte har uppspelningsstöd fortsätter visas utan påhittad grupptillhörighet.

## Regressionstester

`tests/motion-ribbon-browser.mjs` kontrollerar att:

1. En grupp kan fällas ihop utan att en annan grupp påverkas.
2. Gruppernas sammanfattningar förblir synliga och interaktiva.
3. En grupp med flera animationer döljer alla sina animationsdetaljer och återställer dem vid öppning.
4. Presentationens modell är identisk före och efter varje hopfällning.

Tester körs med desktop-, iPad-porträtt- och mobilstorlek.

## Avgränsning

Ingen förändring av PPD-format, export, animationseffekter, uppspelningslogik eller draghandtag. Hopfällt tillstånd sparas inte mellan sessioner.
