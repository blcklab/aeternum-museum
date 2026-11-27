# M8.3 — GitHub Pages deployment

Technical setup only. M8.2 is deferred, not passed. Keep the source repository private while rights are unresolved; a public source repository exposes the original recordings too. Pages may be public even for a private repository. Do not confirm publication until you have the required rights. The workflow does not run on push or tag.

## Museum

1. From a connected machine, run `npm install`, `npm run check`, then commit `package-lock.json`. Confirm `npm ci` succeeds.
2. Create or use the private `blcklab/aeternum-museum` repository (example name; adapt to your actual repo). Push the source to its default branch. Do not commit `dist` or `node_modules`.
3. Once publication rights are confirmed, set Settings → Pages → Build and deployment → Source to **GitHub Actions**. Run **Publish museum to Pages** from the default branch and explicitly confirm rights. The workflow checks, exports, and publishes only `dist/site-preview` plus a small static landing page copied into that directory after the review export.
4. Use the Pages URL reported by the workflow. Example: `https://blcklab.github.io/aeternum-museum/world.anyo.json`. The site is a data repository; its landing page is not a standalone player. Treat this exact world URL as trusted and control all writes to it. Pages deployments replace the site; they are not immutable version archives. For immutable reviewed releases, use versioned static hosting that retains old versions.

## Loader

Install and commit its lockfile separately. For U6 and later, no repository-specific Loader variable is needed. For older museum releases only, the optional legacy Actions variable `AETERNUM_WORLD_URL` can contain the exact approved HTTPS world document URL. Select Pages → GitHub Actions and run **Publish Loader to Pages**. This builds with the Pages base path (including a repository subpath). Use the final URL reported by GitHub. Example:

`https://blcklab.github.io/anyo-world-loader/?registryRoot=https%3A%2F%2Fblcklab.github.io%2Faeternum-museum%2F`

Replace both example URLs with actual values; no repository creation or deployment is performed by this source update.

## HTTP acceptance smoke test

After deployment, from the museum source run:

```sh
npm run verify:hosting -- https://blcklab.github.io/aeternum-museum/ https://blcklab.github.io
```

This samples the world document, artwork, directory/viewer modules and JSON from opaque sandbox origins, both music files, waveform JSON and the ambience ranges. It rejects redirects, unexpected MIME types, missing CORS on cross-origin requests, or ignored audio byte ranges. A successful check is not a browser/physical-device acceptance test. Pages controls response headers; if it fails these checks, use a static HTTPS host with configurable MIME, CORS (including `Origin: null`) and range support rather than weakening the Loader. The Pages workflows require committed lockfiles and do not claim deployment success until GitHub reports it.

## Rollback

Re-run an approved previous source on the default branch (e.g. revert the offending commit), verify the selected ref and URLs again. Rebuilding the Loader for a changed approval is only necessary for legacy integration. Do not expose unreviewed updates on an approved URL. No v1.0.0 tag until the pending rights and physical-device gates pass.
