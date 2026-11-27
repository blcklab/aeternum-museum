# Release preparation — M8.1

Use Node 22.12+ or 24. Run `npm install` and `npm run check`. The generated world, assets and web surfaces are source-controlled. `npm run export:review` checks root assets, rejects symlinks and hidden files (except ignored `.gitkeep` markers), copies the allowlisted runtime tree to `dist/site-preview`, and writes a SHA-256 inventory beside it. Re-running replaces only that generated review tree.

This is **local review only**: it includes the existing Bach and Beethoven recordings. Do not upload until the M8.2 rights gate is satisfied. The Loader's trusted local allowance matches canonical loopback world URLs on port 4174 in development mode only.

## Future production layout

Serve `world.anyo.json`, `anyo.project.json`, `assets/` and `web-surface/` together, preserving paths. Never serve a source checkout containing `.git`, `.env`, `node_modules` or authoring scripts as the site root. `dist/world.anyo.json` alone is not a complete site.

Choose an HTTPS origin/path, preferably an immutable release path. For example, if the world is at `https://museum.example.org/releases/v1/world.anyo.json`, use `registryRoot=https://museum.example.org/releases/v1/` (URL-encoded in a query). Replace the example with your actual reviewed URL. With U6, manifest-declared worlds need no Loader environment variable; legacy approved releases still require an exact URL. Do not use wildcard trusted approvals.

Configure JSON/HTML/JS/MJS/CSS/WebP/MP3/Ogg MIME types, CORS for world, iframe-module and media requests (opaque sandbox origins may send Origin: null), and single byte-range requests for audio seeking. Do not use credentialed wildcard CORS. Revalidate mutable manifests; cache immutable versioned paths. Verify deployed responses in M8.3–M8.4.

## Release gates

1. Museum and Loader `npm run check`, plus review export.
2. Generate and commit both npm lockfiles on a connected machine; verify `npm ci` afterward. Neither supplied baseline contains a lockfile.
3. Audit artwork and recording rights; resolve pending items and retain attribution.
4. Deploy only reviewed files; configure exact URL, HTTPS, CORS and media ranges.
5. Complete the [acceptance checklist](acceptance.md), including real Android/iOS devices and both GPU backends.
6. Tag only after all gates pass. M8.1 does not publish or bump the world revision.
