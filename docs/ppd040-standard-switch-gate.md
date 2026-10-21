# PPD 0.4 – spärrkontroll inför standardbyte

Den här PR:en lägger till en **körbar beredskapskontroll**, inte ett formatbyte. Kontrollens uppgift är att uttryckligen visa kvarvarande obligatoriska beroenden innan `createDocument()` börjar skriva 0.4.0.

## Bekräftade hinder från den aktuella kodbasen

| Kontroll | Nuvarande läge | Krävd åtgärd |
| --- | --- | --- |
| Standarddokument | `createDocument()` skapar `0.3.1` | Låt nya presentationer utgå från 0.4 med giltiga konturer |
| Kanoniskt schema | `schemas/ppd.schema.json` är `0.3.1` medan `proposals/ppd-0.4.0.schema.json` är förslaget | Promovera ett granskat 0.4-schema och synkronisera dokumentation/fixturer |
| Separat JSON-API | `createPpd040` och `readPpd040Json` finns | Bevaras och integreras med ordinarie flöden |
| Redigeringsmotor | `EditorStore` accepterar 0.4 | Bredda regressioner för alla verktyg |
| Import och validering | `negotiate` och `validateCore` känner igen 0.4 | Inkludera HTML-offline och vanliga öppna-/sparaflöden i sluttest |
| Export | PDF/PPTX-artefaktkontroller finns | Kör funktions- och visuell exportparitet för vanliga egenskaper |

## Rekommenderat nästa kodsteg

Gör **en samordnad switch-PR** som uppdaterar standarddokument och kanoniskt schema *tillsammans* med funktionell regression för skapa → redigera → spara → öppna → export. Byt inte bara versionssträngen, då blir `stroke` och `strokeWidth` ogiltiga i det nya schemat. Ta ställning till äldre fixtures separat; användaren har uttryckligen tillåtit brytande förändringar.

`ppd040StandardGate()` visar att JSON-roundtrip, editor-core och versionsförhandling redan är testbara, men att standarddokument och kanoniskt schema fortfarande behöver åtgärdas. Status `ready:false` är därför **förväntad och korrekt** i denna PR.
