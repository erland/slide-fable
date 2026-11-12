# PPD v0.3 – ursprungligt referensunderlag

> **Historiskt, oförändrat källunderlag:** Detta är projektets ursprungliga PPD 0.3-referenspaket. Det ska inte förväxlas med det aktiva PPD 0.4.0-schemat i projektet. För gällande formatversion och avgränsad äldre import, se [PPD-kontraktet](../docs/ppd-contract.md) och [dokumentationsöversikten](../docs/README.md). Referensschemat och originalexemplet bevaras för källintegritet och historiska tester.

Innehåller sammanhängande format- och funktionsspecifikationer (v0.2 med normativa v0.3-tillägg), JSON Schema Draft 2020-12, ett minimalt schemaexempel och valideringskontroll.

Den kanoniska modellen är sanningskälla; HTML, PDF och PPTX är härledda representationer. `example.ppd.json` demonstrerar de två nya typerna `semanticDiagram` och `equation`.

Kör: `python -m pip install jsonschema` och `python validate_example.py`. Schemat validerar struktur; tvärreferenser, SVG-sanering och avancerade exportkrav kräver separat semantisk validator.

Observera att `$id` har en platshållardomän och inte är en publicerad schema-URL.
