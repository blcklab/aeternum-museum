# AETERNUM

A virtual museum of art, science and philosophy, built with Anyo World 0.9 and Sekai64. Designed by BLCK LAB.

**Release candidate:** 1.0.0-rc.4 · World revision 34. Intended for private acceptance testing; public/stable release is pending rights verification, production hosting and browser acceptance testing. See [U8 character acceptance](docs/character-acceptance-u8.md) and [RC1 release history](docs/release-candidate.md).

## Explore

Install Node.js 22.12+ or 24, then from this repository:

```sh
npm install
npm run dev
```

Run the matching Anyo World Loader separately (`npm install`, `npm run dev`). Open:

```text
http://127.0.0.1:4173/?registryRoot=http%3A%2F%2F127.0.0.1%3A4174%2F
```

**I** opens the world-owned Character panel (or use its visible button); **M** opens the directory, map and guided tours; **N** opens the Neirox soundtrack and optional environmental audio; **E** interacts with nearby exhibits and surfaces; **Esc** closes an active popup. On touch devices, use the on-screen controls. Autoplay is gesture-gated and respects visitor preferences.

## Collection

13 galleries, an entrance and a grand promenade; 72 unique exhibited artworks, an HD viewer, and science and philosophy exhibits. Desktop uses authored artwork quality; mobile Auto selects a smaller texture tier before loading. Original artwork is retained for inspection.

## Authoring

- `world.anyo.json` — canonical World 0.9 document, revision 34.
- `assets/museum/manifest.json` — artwork catalog and attribution.
- `assets/audio/soundscapes.json` — music, recording credits, room ambience and footsteps.
- `web-surface/` — directory and artwork viewer.
- `scripts/` — generation, validation and optional authoring tools.
- `host-integration/` — integration reference; Loader owns trusted host capabilities.

Edit the relevant catalog, then run `npm run generate` and `npm run check`. To add music, copy a permitted recording into `assets/audio/` and add its ID, title, artist and filename to the manifest; include attribution, source and rights. Optional waveform generation: `python scripts/generate-waveforms.py <track-id>` (FFmpeg required). No Python is needed at runtime.

## Release review

```sh
npm run check
npm run export:review
```

The second command creates `dist/site-preview/`, a local review-only static tree, plus `dist/review-inventory.json` containing file hashes. **Do not publish this tree until the rights audit is complete.** See [release preparation](docs/release-preparation.md) and [acceptance checklist](docs/acceptance.md).

The bundled document under `dist/world.anyo.json` alone is not a deployment. Preserve the canonical root and all asset and web surface paths. HTTPS is recommended for production, with CORS and media range support. Legacy trusted integrations may require exact reviewed world URL approval; manifest-declared audio and popup navigation do not.

## Rights

Artwork and music have individual attribution and license metadata; no blanket content license is asserted. Both classical recordings carry user-supplied CC BY-NC 4.0 labels pending source verification. Do not distribute publicly or commercially until applicable rights are checked. See [release history](docs/release-history.md) for earlier implementation notes; current instructions supersede historical instructions.

## Hosting preparation (M8.3)

See [GitHub Pages deployment](docs/hosting.md) for manual publishing, exact URL approval and release gates.

### Universal Loader discovery

`anyo.project.json` declares the soundtrack, reception destinations, tours, and Web Surface directory. These are repository-relative declarations. U4 enables generic audio; U5 enables generic popup navigation with visitor consent. U3 renders CDN HTML in a sandbox. U6 enables the generic physical directory and pre-load image profiles. Live CDN acceptance remains pending.

### Universal navigation (U5–U6)

With the U5 Loader, the declared reception app, destinations and tours enable generic popup navigation without a museum-specific environment variable. Press M and use the Loader-owned **Enable navigation** button, then select a room or guided tour. Permission lasts only for the open popup. The U6 manifest supplies the physical directory cover and mobile artwork profiles, with no per-world environment configuration. Older Loaders may still require the exact approved URL. Run `node scripts/generate-world-texture-profiles.mjs` after regenerating artwork derivatives; commit the resulting catalog. The world geometry, artwork, audio and original directory app remain unchanged.

### World-owned characters (U8 candidate)

The museum declares its own avatar and animation catalogs in `anyo.project.json`. Two acceptance robots share the existing museum scene. Cyan uses the shared catalog and Amber uses a separate action catalog. Both use the author-supplied idle, walk and jump VRMA files; all directional walking and running share the walk clip. Run `npm run test:characters` to validate model and animation bytes. See [U8 character acceptance](docs/character-acceptance-u8.md) for local and GitHub checks and rights gates. World revision 34 is intentionally unchanged.

RC4 starts without a playable character by default. Press I / Character to select a scout; select No character to return to first person. Use the updated nullable-default Loader. Existing saved choices override the default.
