# Autoscale → Reserved VM: stability audit (Nov 2026)

**Question:** will IQRA crash if the deployment is switched from Autoscale to a Reserved VM?

**Answer:**
- **Before this fix, yes.** I found and reproduced a crash that a long-running server makes much more likely.
- **That crash is now fixed and tested.**
- **One platform question can't be checked from the code:** whether Replit runs IQRA's two-service layout on a Reserved VM. Use the switching steps below so the live site is never at risk.

## Why apps crash after switching

On **Autoscale**, server processes are started and stopped constantly, so they rarely live more than minutes. On a **Reserved VM**, one process runs for days or weeks. Bugs that only show up in long-lived processes, such as dropped connections or slowly growing memory, appear after the switch.

## What was checked

| Area | Finding | Status |
|---|---|---|
| **Database connections** | Replit's database drops idle connections, for example when it suspends after ~5 idle minutes. IQRA's connection pool had no error listener, so a dropped connection made Node exit the whole server. **Reproduced locally:** killing idle connections crashed the server (`Unhandled 'error' event`, exit code 1). | **Fixed** (`lib/db/src/index.ts`) |
| Connection in use when dropped (e.g. while indexing a big PDF) | Same crash path for connections checked out of the pool. | **Fixed:** every connection gets its own error listener |
| Stray background errors | Node 24 exits on an unhandled promise rejection. All four background tasks (chat generation, Drive import, maintenance jobs, donation backfill) already catch their errors. A safety net is added anyway. | **Fixed:** logged, server keeps running |
| Truly unexpected exceptions | Now logged, then the process exits cleanly; Replit restarts a process that exits. | Hardened |
| Redeploy / stop | Replit sends a stop signal. The server now stops taking requests, stops the indexer, finishes in-flight requests (up to 10 s) and closes database connections. Interrupted indexing jobs are picked up again later. | **Added** |
| Memory growth over days | The chat job list removes finished jobs automatically and limits how many can run. No other in-memory list grows without limit. | OK |
| Port / network binding | The API listens on `PORT` on all interfaces, as Replit requires (not just `localhost`). | OK |
| Health check (homepage must answer within 5 s) | The homepage is a pre-built static page; database setup runs before the API starts listening and takes about a second locally. | OK |
| Files on disk | The server's disk resets on each publish. Uploads go to object storage and the search index to Postgres; nothing relies on local disk. | OK |
| In-progress Drive import / maintenance job | Progress is held in memory, so a restart loses it. Re-running an import is safe, because duplicates are skipped. | Known, acceptable |

### Test results (local Postgres, built production server)
- **Idle connections killed, 3 rounds:** before the fix, the server crashed. After the fix, it stayed up, logged the drop and reconnected on the next request every time.
- **Connection killed while in use:** the process stayed up, the query on the dead connection failed normally for its caller, and the next query worked.
- **Stop signal (what Replit sends on redeploy):** the server logged "Shutting down" and exited cleanly (code 0).
- **Server test suite:** 70/70 pass.

## Not verifiable from the code: IQRA's two-service layout

IQRA is published as two services behind Replit's router: the API at `/api` (port 8080) and the pre-built website at `/`. Replit's docs say "Reserved VM deployments support only one external port". They don't say whether a router-based project like this is supported on a Reserved VM. Only Replit can confirm. Ask Replit's own Agent in the workspace, or follow the steps below.

## Machine size

- **Normal use:** Dedicated 1 vCPU / 4 GB ($35/month). Avoid the shared 0.5 vCPU / 2 GB tier. One upload can hold 50 MB in memory, PDF text extraction can use several times the file size, and chat traffic runs alongside it.
- **The 60 GB import month:** Dedicated 2 vCPU / 8 GB ($50/month). A Drive import downloads 4 files at once (up to 50 MB each) while the indexer reads another.

## Safe switching steps
1. **Deploy the stability fix on Autoscale first** and confirm the site works as usual.
2. **Switch at a quiet hour:** Publishing → Adjust settings → Deployment type → Reserved VM, then Dedicated 2 vCPU / 8 GB. Republish.
3. **Check right after publishing:**
   - The homepage loads.
   - Sign in works.
   - A chat question gets an answer (logs: `Answered with claude-sonnet-5-5`).
   - The admin dashboard opens.
4. **If publishing fails or anything misbehaves:** switch the deployment type back to Autoscale and republish. Your database, files and settings are not affected by the deployment type.
5. **Over the next days:** search the logs for `database connection dropped`. Those lines are expected and harmless now. Also search for `Uncaught exception`, which should never appear.
