# SF-ANIM-03 – stabilare punktanimationer vid textredigering

Punktanimationer lagras fortsatt med PPD 0.4:s styckeindex (`from.paragraph.x`). Vid redigering i Slide Fable jämförs styckenas stabila `id` före och efter ändringen och index räknas om när liststycken flyttas. Om en animerad punkt tas bort eller slutar vara en listpunkt tas den felriktade punktanimationen bort, utan att påverka andra objektanimationer. Förändringen sker i samma ångra/gör om-transaktion som textredigeringen.

Detta omfattar `editText` och textuppdateringar via `updateElement`. Ett importerad dokument med redan felaktiga styckeindex kan inte rekonstrueras säkert, och externa verktyg som ändrar stycke-ID:n kan inte få identitetsbaserad koppling utan ytterligare metadata. PPD-formatet ändras inte. Statisk PDF/PPTX-export påverkas inte.

Regressionstester: `tests/playback.test.mjs` kontrollerar omordning, listpunkt som upphör, bevarande av vanliga animeringar, PPD-validering samt ångra/gör om.
