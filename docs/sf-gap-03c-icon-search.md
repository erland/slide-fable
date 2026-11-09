# SF-GAP-03C – sökning och kategorier i ikonbiblioteket

## Omfattning
Ikonväljaren under **Infoga → Ikoner** erbjuder nu:
- Direkt sökning i katalogens svenska namn, stabila ID och kategori.
- Sökning oberoende av stora och små bokstäver samt diakritiska tecken (t.ex. `sakerhet` hittar **Säkerhet**).
- Kategorifilter: **Alla**, **IT** och **Verksamhet**, med tillgängligt `aria-pressed`-tillstånd.
- Resultaträkning och texten **Inga ikoner matchar sökningen.** när filtreringen inte ger träffar.

Sökningen körs enbart mot den lokala ikonlistan, utan internetanrop, ny paketberoenden, förändring av PPD-formatet eller nya exportregler. Ikonobjekten kan fortsatt infogas, redigeras och sparas på samma sätt som tidigare. Filterinställningarna behålls inom redigerarsessionen.

## Verifiering
- `tests/icon-catalog.test.mjs`: svenska sökord, diakritiska tecken, flera söktermer, filter, tomma resultat.
- `tests/insert-gallery-browser.mjs`: sökning, resultatlista, filter, tomt läge och ikoninfogning i Chromium för desktop, stående iPad och telefon.
- Den fullständiga GitHub Actions-kandidatverifieringen kontrollerar även PPD, PDF, PPTX, HTML, PWA och regressioner.

## Avgränsningar
Inga nya ikoner eller justeringar av exportparitet i detta steg. Native redigerbara PowerPoint-vektorikoner är en separat möjlig vidareutveckling.
