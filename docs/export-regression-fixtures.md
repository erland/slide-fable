# IP-008 – Exportregressioner

`fixtures/export-regression-v1.json` innehåller uttryckliga förväntningar för native/hybrid/rasteriserad export i PDF och PPTX. `tests/editor-browser.mjs` läser dessa och verifierar `preflight` i Chromium, där exportmotorns webbläsarberoenden finns tillgängliga.

Projektets befintliga `tests/editor-browser.mjs` testar faktiska PDF/PPTX-filer, OOXML-struktur och bildexport. Det körs i GitHub Actions genom releaseverifieringen. Fixturetesterna kompletterar detta med låsta statuskrav och varningstext.

Observera att automatiska tester inte ersätter granskning i PowerPoint (Mac/Windows) eller oberoende PDF-läsare.
