# Källor och underlagsgränser

Primärt: de sex oförändrade filerna i `reference/`, bifogade 2026-10-19.
SHA-256 per fil finns i `.system-builder/reference-hashes.json`.
Format och produktkrav härrör från dessa filer samt användarens PWA-/enhetskrav.

Tekniska primärkällor kontrollerade 2026-10-19:
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
  Manifest/HTTPS samt plattformsspecifika installationsflöden.
- https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
  Appcache, offline och service-worker-livscykel.
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
  Best-effort-lagring, beständig lagring och kvothantering.
- https://gitbrent.github.io/PptxGenJS/docs/api-shapes.html
  Kandidatens form-/text-API; ingen evidens för färdig Slide Fable-export.
- https://katex.org/docs/security
  Trust, makroexpansion, resursgränser och säkra felmeddelanden.

Kompletterande primärkällor i DEV-001, 2026-10-19:
- https://www.rfc-editor.org/rfc/rfc8785 – JSON Canonicalization Scheme.
- https://json-schema.org/draft/2020-12/json-schema-validation – schemavalidering.

Komplettering DEV-002, 2026-10-19:
- https://pdf-lib.js.org/docs/api/classes/pdfdocument – klientgenerering och fontinbäddning.
- https://tiptap.dev/docs/editor/getting-started/install/vanilla-javascript – editor/bundling.
- https://tiptap.dev/docs/editor/extensions/functionality/starterkit – paragraph och marks.
- https://gitbrent.github.io/PptxGenJS/docs/installation/ – browserbyggd OOXML-export.
Exakta installerade versioner/licensmetadata finns i dependency-inventory.json;
det är de lokala körningarna som styr vilka funktioner som här räknas som bevisade.

Komplettering DEV-003, 2026-10-19:
- https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting
- https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
- https://vite.dev/guide/build – relativa basvägar och statiskt bygge.
- https://react.dev/learn/typescript – React/TypeScript.
Paketversioner är kontrollerade via npm-registret och låsta i projektets package-lock.json.

Arkitekturval och budgetar är projektförslag/inferenser, inte externa källors
garantier om prestanda, kostnad eller plattformsparitet.
