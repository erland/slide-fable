# SF-QUAL-02 – Pages efter godkänd kandidatverifiering

## Varför

GitHub Pages körde tidigare `npm test` **en andra gång** på en push till `main`, parallellt med `Verify Slide Fable candidate`. Efter PR #142 fick kandidatverifieringen på `main` status **success** (42776994758), medan den fristående Pages-körningen (42776995107) misslyckades i `panel-workflow-browser.mjs` med `Cannot read properties of null (reading 'id')`. Efter PR #141 inträffade motsvarande skillnad vid ett annat webbläsartest.

Den dubbla testkedjan gjorde att en redan godkänd commit kunde nekas driftsättning på grund av ett oberoende tidsberoende testutfall.

## Ändring

- `deploy-pages.yml` startar via `workflow_run.completed` för arbetsflödet `Verify Slide Fable candidate`, inte via en egen `push`.
- Jobbet kör endast när kandidatverifieringen slutade med **success**, avsåg `main`, kom från **samma repository**, och verifieringen startade av `push` eller `workflow_dispatch`.
- Checkar ut **exakt verifierad SHA**, inte en senare rörlig `main`-referens.
- Kontrollerar SHA mot `HEAD`, aktuell remote `main` och uppgifter för den godkända GitHub Actions-körningen. Om `main` har gått vidare avbryts den äldre driftsättningen.
- Installerar projektets Node-beroenden och bygger med `SF_BUILD_ID` satt till den verifierade SHA:n.
- Tar bort duplicerad installation av Chromium/Poppler och den andra `npm test`-körningen. Resterande standardsteg för Pages-upload och -deploy behålls.
- Lägger till `workflow_dispatch` i **verifieringsflödet**. För en manuell omdriftsättning: starta `Verify Slide Fable candidate` på `main` under Actions. Om den blir grön startar Pages automatiskt. En direkt manuell Pages-start kan inte hoppa över säkerhetsgrinden.

## Regression och kontroll

`tests/pages-deploy-gate.test.mjs` ingår i enhetstesterna och verifierar att båda workflows tillsammans upprätthåller kravet på samma commit, godkänt resultat och ingen duplicerad webbläsarsvit.

CI på PR-verifieringen visar att konfiguration och källkod passerar testerna, men kan **inte** bevisa att det nya `workflow_run`-flödet verkligen driftsätter förrän PR är mergad till `main`. Bekräfta då att kandidatverifiering och efterföljande Pages-körning för samma commit båda lyckas.

## Risker och avgränsning

- Den här ändringen är ett arbetsflödesbeslut, inte en rättning av alla tidsberoende UI-tester. Fortsatt teststabilitet bör följas separat.
- `workflow_run` kan köras med mer privilegier än källarbetsflödet. Därför görs strikt kontroll av branch, repository, händelsetyp, resultat och commit innan kod checkas ut och byggs.
- Samma verifikation granskas **inte** på nytt i deploy-körningen. Det är avsiktligt; ett grönt resultat från det etablerade kandidatflödet används som grind.
- Ingen ändring i presentationsmodell, dokumentformat eller releaseacceptans. Projektet förblir `NOT_READY` för formell MVP tills de kvarvarande manuella grindarna är klara.
