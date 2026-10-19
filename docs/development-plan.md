# Utvecklingsplan

Användaren har 2026-10-19 gett mandat att arbeta genom hela följden utan mellanfrågor.
Status finns enbart i work-status.yaml. Genomgång och utvecklingsarbete har förts
till DEV-015; klarkriterier som saknar belägg kvarstår öppna enligt release-review.md.
DEV-001–003:s scope finns kvar nedan för historisk spårning.
Planen är mål, inte ett påstående om levererad appfunktion.

## DEV-001 – PPD-kontrakt och fixturer
Förutsättningar/beroenden: verifierad planeringsleverans.
Mål och omfattning: Stäng GAP-01–12; inför en dokumenterad kompatibilitetsprofil, ID-scopes, migrationskontrakt och positiva/negativa fixtures.
Verifiering och klart-kriterium: Schema och semantiska kontraktstester; originalexemplet kvar kompatibelt; varje GAP har beslut och test.
Berörda områden: enligt modulansvar i målarkitekturen; tester och dokument/status ingår.

## DEV-002 – Tekniska riskspikar
Förutsättningar/beroenden: DEV-001.
Mål och omfattning: Prova rik text/DOM-SVG, säker SVG/MathML, sökbar offline-PDF på tablet och native-PPTX med glaseffektlager. Lås kandidater/versioner/licenser efter evidens.
Verifiering och klart-kriterium: Öppningsbar prov-PPTX med separata objekt, sökbar prov-PDF och dokumenterade plattformsbegränsningar. Blockera beroende steg vid misslyckad kärnförmåga.
Verifieringsutfall och miljöbegränsade prov finns i dev002-technical-decisions.md.
OOXML och PDF är kontrollerade lokalt; faktisk Office-redigering är fortsatt releasegrind i DEV-014/015.
Berörda områden: enligt modulansvar i målarkitekturen; tester och dokument/status ingår.

## DEV-003 – Källprojekt och responsivt PWA-skal
Förutsättningar/beroenden: DEV-002.
Mål och omfattning: React/TS/Vite, manifest/ikoner, service worker, säker uppdatering, responsiva paneler, CI och testmiljö.
Verifiering och klart-kriterium: Build/typecheck/lint PASS; faktiskt browserprov för offline-start; mobil/tablet/desktop-layout och uppdatering utan förlorat utkast.
Berörda områden: enligt modulansvar i målarkitekturen; tester och dokument/status ingår.

## DEV-004 – Domänkärna och säker filimport
Förutsättningar/beroenden: DEV-003.
Mål och omfattning: PPD-parser, semantik/resursintegritet, importdiagnostik, migrationsimplementation och read-only/fallback.
Återanvänd DEV-001:s kontraktsfixturer i TypeScript-paritet. Införskaffa schema/fixturer
för 0.1/0.2 och verifiera förlustfri migration före full MVP; sådant stöd är ännu inte levererat.
Verifiering och klart-kriterium: Giltiga fixtures accepteras; brutna referenser, XSS och okända obligatoriska features hanteras; aktuell arbetskopia intakt vid fel.
Berörda områden: enligt modulansvar i målarkitekturen; tester och dokument/status ingår.

## DEV-005 – Första redigeringskedjan
Förutsättningar/beroenden: DEV-004.
Mål och omfattning: Slides, text, former, flytt/storlek/rotation, gemensam renderer och kommandotransaktioner med undo.
Verifiering och klart-kriterium: Skapa tre slides, ändra text/form, ordna och ångra via touch och tangentbord; rätt PPD-modell.
Berörda områden: enligt modulansvar i målarkitekturen; tester och dokument/status ingår.

## DEV-006 – Arbetskopior och återställning
Förutsättningar/beroenden: DEV-005.
Mål och omfattning: IndexedDB, sparstatus, felåterhämtning, flikkonflikt och filbackup.
Verifiering och klart-kriterium: Omstart återställer senast bekräftade revision; kvotfel och samtidiga flikar ger ingen tyst överskrivning.
Berörda områden: enligt modulansvar i målarkitekturen; tester och dokument/status ingår.

## DEV-007 – Fristående HTML och vertikalt delmål
Förutsättningar/beroenden: DEV-006.
Mål och omfattning: Enfilspaketerare, offline-player och återimport, enkla mallar och stilar.
Verifiering och klart-kriterium: Tre slides HTML-exporteras, kallöppnas offline och återimporteras med bevarade ID:n/semantik; ingen extern hämtning.
Berörda områden: enligt modulansvar i målarkitekturen; tester och dokument/status ingår.

## DEV-008 – Rik text och precisionsredigering
Förutsättningar/beroenden: DEV-007.
Mål och omfattning: Runs/listor, klippbord, sök, grupper, lager, lås, snapping, fördelning, ankare och formatpensel.
Verifiering och klart-kriterium: AT-203–205 och AT-217 med roundtrip; group/undo och kopiering behåller referensintegritet.
Berörda områden: enligt modulansvar i målarkitekturen; tester och dokument/status ingår.

## DEV-009 – Master, teman och komponenter
Förutsättningar/beroenden: DEV-008.
Mål och omfattning: Master/layouter/platshållare/overrides, återställ layout, dokumentkomponenter och premiumbakgrunder.
Verifiering och klart-kriterium: AT-201–202; masterändring bevarar lokalt innehåll; komponent- och stilroundtrip; Safari/Chromium-visuell jämförelse.
Berörda områden: enligt modulansvar i målarkitekturen; tester och dokument/status ingår.

## DEV-010 – Bilder, tabeller och datadiagram
Förutsättningar/beroenden: DEV-009.
Mål och omfattning: Crop/mask/fokus/filter, cellredigering/merge och bar/line/pie med datatabell.
Verifiering och klart-kriterium: AT-206–208; dataset, celler och crop överlever save/reopen; tillgängliga dataalternativ.
Berörda områden: enligt modulansvar i målarkitekturen; tester och dokument/status ingår.

## DEV-011 – Semantiska diagram, formler och vektor
Förutsättningar/beroenden: DEV-010.
Mål och omfattning: Process/hierarki/tidslinje, säkra LaTeX/MathML och SVG-banor, källa/layout separat.
Verifiering och klart-kriterium: AT-301–303, F-301–303 och negativa säkerhetsfall; ID:n och källa kvar efter roundtrip.
Berörda områden: enligt modulansvar i målarkitekturen; tester och dokument/status ingår.

## DEV-012 – Presentatör och tillgänglighet
Förutsättningar/beroenden: DEV-011.
Mål och omfattning: Publik/presentatör, anteckningar/timer, fragment/slutvy, sektioner, kontrast och läsordning.
Verifiering och klart-kriterium: AT-209 och reduced-motion; publikvy exponerar inte anteckningar; touch/tangentbord och säker popup-fallback.
Berörda områden: enligt modulansvar i målarkitekturen; tester och dokument/status ingår.

## DEV-013 – PDF och bildexport
Förutsättningar/beroenden: DEV-012.
Mål och omfattning: Sökbar PDF enligt bevisad exportväg, slideurval, PNG/JPG, rapporter och avbrottshantering.
Verifiering och klart-kriterium: AT-212/218; korrekt sidantal/aspekt och sökbar svensk text i riktig läsare; export fungerar offline enligt deklarerad profil.
Berörda områden: enligt modulansvar i målarkitekturen; tester och dokument/status ingår.

## DEV-014 – PPTX och exportinsyn
Förutsättningar/beroenden: DEV-013.
Mål och omfattning: Editable-first/visual-first/flattened, native-basobjekt/tabell/diagramformer och separata effektlager.
Verifiering och klart-kriterium: AT-213–215/306, OOXML och faktiska Office-prov Mac/Windows; rapport över varje objekt, ingen tyst utelämning.
Berörda områden: enligt modulansvar i målarkitekturen; tester och dokument/status ingår.

## DEV-015 – Samlad acceptans och releaseberedskap
Förutsättningar/beroenden: DEV-014.
Mål och omfattning: Full kravavstämning, enhetsprestanda, PWA-installation, säkerhet, drift/användarguide och komplett käll-ZIP.
Verifiering och klart-kriterium: Alla tillämpliga MVP-krav PASS för aktuell källrevision; manuella Safari/iOS/Office/PDF-prov med evidens. Inga kritiska blockerare.
Berörda områden: enligt modulansvar i målarkitekturen; tester och dokument/status ingår.

## Återstående etapper efter MVP
Frihand/actions/media/kod/galleri och utökade diagram planeras separat. Därefter
3D/kartor/inbäddade dokument, PPTX-import, kommentarer och eventuellt molnsamarbete/AI.
Dessa krav kvarstår i källunderlaget och får inte markeras levererade av MVP.
