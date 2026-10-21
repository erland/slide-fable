# IP-010 – Profilering av historik och minnestryck

Kör med Node 22 och installerade beroenden:

```sh
npm ci
npm run profile:history > history-profile.json
```

Skriptet jämför två scenarier: 20 bilder med 128 KiB inbäddad asset respektive 100 bilder med 2 MiB inbäddad asset. Tolv titeltransaktioner per scenario följs av undo och redo. Rapporten anger median, p95, max, undo/redo-tid, JSON-storlek och förändring i heap.

Heapförändring är inte detsamma som total minnesanvändning. Mätningen är inte heller en validering av bildavkodning eller fysisk mobil Safari. Upprepa på samma hårdvara, ange Node-version och dokumentera variation. SF_PROFILE_ITERATIONS kan ändra antalet transaktioner.

Beslutsregel: optimera inte historiken i förtid. Om reproducerbara mätningar visar en tydlig prestandarisk, undersök structuredClone och upprepad JSON.stringify över historiken, och pröva coalescing eller strukturell delning i separat PR med regressionsskydd.

Ingen produktionskod eller PPD-format ändras. Denna PR tillför mätinstrumentet; faktiska resultat kan dokumenteras efter körning i fullständig miljö.