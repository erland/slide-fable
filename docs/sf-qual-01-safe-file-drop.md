# SF-QUAL-01 – säker filsläppning och stabilare driftsättning

## Observerad avvikelse

GitHub Pages-körning **42759337920** för `main` efter PR #141 misslyckades i `tests/external-transfer-browser.mjs` med:

```
AssertionError: desktop: unsupported file must not navigate browser
false !== true
```

Samma `main` hade en godkänd PR-verifiering (PR #141) och en separat kandidatverifiering. Pages-workflowen kör ändå en egen fullständig webbläsarsvit. Utfallet är därför ett reproducerbart tecken på ett timingberoende test/produktproblem, inte i sig ett bevis för en trasig Pages-tjänst.

## Identifierad produktorsak

Canvasens `onDragOver` och `onDrop` anropade bara `preventDefault()` när redigeraren **inte** var upptagen eller låst. En pågående asynkron bildimport aktiverar `safety.busy`. Under detta korta tidsfönster kunde en släppt fil lämnas till webbläsarens standardbeteende (t.ex. navigering till den släppta filen).

## Ändring

- För fil- och textdata stoppar canvasen nu webbläsarens standardbeteende **före** kontroll av redigerarens `readOnly`, `busy`, `locked` eller presentationsläge.
- `dragover` anger `dropEffect='none'` när redigering är blockerad, annars `copy`.
- Ett otillåtet filformat avvisas fortfarande uttryckligen. PNG/JPEG/WebP-import, säker textinklistrning och PPD-format är oförändrade.
- Regressionstestet provar både en SVG-fil och en PNG-fil under en avsiktligt startad `updateSafety.beginOperation()`. Testet väntar på Reacts renderade busy-tillstånd och kontrollerar att både `dragover` och `drop` förhindrar standardbeteende samt att dokumentet inte ändras.

## Verifiering och avgränsning

Automatisk regression ingår i `npm test` och kandidatverifiering. Grön CI krävs för PR och bör även följas av en lyckad driftsättning på `main`.

Denna ändring rättar en konkret produktdefekt som utlöste det varierande CI-felet. Den gör inte i sig en formell releaseacceptans. Fysiska Safari-enheter, Office-import/export och återstående releasegrindar måste provas separat.

**Kvarvarande processrisk:** `deploy-pages.yml` kör hela `npm test` en gång till, utöver `verify.yml`. En framtida separat PR kan göra driftsättningen beroende av verifierad kandidat på exakt samma commit och därefter enbart bygga/paketera artefakten; detta steg ändrar inte arbetsflödesorkestreringen.
