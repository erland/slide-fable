# PPD v0.3 leverans

Innehåller sammanhängande format- och funktionsspecifikationer (v0.2 med normativa v0.3-tillägg), JSON Schema Draft 2020-12, ett minimalt schemaexempel och valideringskontroll.

Den kanoniska modellen är sanningskälla; HTML, PDF och PPTX är härledda representationer. `example.ppd.json` demonstrerar de två nya typerna `semanticDiagram` och `equation`.

Kör: `python -m pip install jsonschema` och `python validate_example.py`. Schemat validerar struktur; tvärreferenser, SVG-sanering och avancerade exportkrav kräver separat semantisk validator.

Observera att `$id` har en platshållardomän och inte är en publicerad schema-URL.
