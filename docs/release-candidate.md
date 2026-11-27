# AETERNUM 1.0.0-rc.1

M8.5 — private release candidate. This is not the stable v1.0.0 release and does not grant public distribution rights.

## Compatibility

- Museum package version: `1.0.0-rc.1` (formerly `0.1.34`).
- Anyo World document format: `0.9`; authored revision: **34**. Do not set the revision to 1 or 35 merely to match the package version. Trusted Loader integrations explicitly recognize revision 34.
- Matching host: the accompanying Anyo World Loader `0.6.0-rc.1` source archive, including all AETERNUM hotfixes and M8 acceptance tooling. The Loader version alone does not identify its AETERNUM patch level; record its Git commit.
- No engine, renderer, scene, artwork, music, web surface, or runtime changes are intended by the RC preparation.

## Candidate review

Use Node 22.12+ or 24. In each repository generate and commit a real `package-lock.json` with `npm install` on a connected machine; confirm `npm ci` in clean checkouts. The supplied archives do not include lockfiles. Keep both repositories private until content distribution rights are verified.

Museum: `npm run check`, `npm run export:review`. Loader: `npm run test:aeternum`, then `npm run check`. See [acceptance](acceptance.md) and the Loader acceptance runbook for browser smoke and physical-device checks. The review export is not authorized for publication. Do not activate Pages until publication rights are confirmed.

If you want to identify the candidate in a private museum repository, after committing the exact tested candidate (including lockfile), run `git tag -a v1.0.0-rc.1 -m "AETERNUM release candidate 1"`. A local tag alone does not deploy anything. Do not push it to a public repository while rights are pending. Do not reuse this tag for different content; use rc.2 for fixes if necessary.

## Stable promotion gates (all required)

| Gate | Evidence | Current status |
| --- | --- | --- |
| Clean dependency installation | Both committed lockfiles and successful npm ci | Pending |
| Automated checks and build | Full museum check, full Loader check and production build | Partial; full Loader build/suite pending |
| Rights | Verify artwork and both recordings, licenses, attribution and applicable use restrictions | Deferred, not waived |
| Hosted acceptance | Approved exact HTTPS world URL; actual hosted smoke, CORS/MIME and ranges | Pending |
| Browser/device acceptance | Desktop both backends; Android Chrome and iOS Safari; signed-off test matrix | Pending |

Record the exact museum and Loader commit hashes, tested URLs and evidence. If fixes are needed, issue another release candidate and rerun affected checks. Once all gates pass, set museum package version to `1.0.0`, update the lockfile and documentation, rerun checks, commit and tag `v1.0.0`. Keep document revision 34 if runtime content remains unchanged. Follow the reviewed hosting workflow; no automatic public deployment or tag push is performed by this RC.
