# UX-14 – Kompakta tabellåtgärder

## Bakgrund
Tabellredigeraren har fått flera kommandon för varje rad och kolumn. De långa knapptexterna gör panelen svåröverskådlig, särskilt på telefon och stående surfplatta.

## Ändring
- Flytta rad använder ↑ / ↓ och flytta kolumn använder ← / →, med oförändrade fullständiga tillgängliga knappnamn.
- Duplicera och Ta bort visas kortfattat i separata märkta åtgärdsgrupper för respektive rad och kolumn.
- Responsiv layout ger strukturella kommandon en egen flexgrupp och minst 44 px höga tryckytor på små skärmar.
- Befintlig cellredigering, modell, lagring, export, Ångra/Gör om och PPD-format påverkas inte.

## Verifiering
`tests/table-split-browser.mjs` kontrollerar gruppnamn, knappnamn och synliga korta texter på desktop, iPad portrait och mobil, samt tidigare tabellflöden. Kandidat-CI måste passera innan merge. Manuell Safari/iPad och Office-acceptans ingår inte. Release kvarstår NOT_READY.
