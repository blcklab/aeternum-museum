# World authoring

Use Node.js 22.12+ or 24 and install dependencies with `npm install`. The museum uses the pinned Anyo authoring package; the Loader is a separate project.

## Repository structure

| Path | Purpose |
| --- | --- |
| `world.anyo.json` | Canonical Anyo World 0.9 document (revision 34) |
| `anyo.project.json` | Repository entry and capability manifests |
| `assets/museum/manifest.json` | Artwork catalog and attribution |
| `assets/audio/soundscapes.json` | Music, ambience and footsteps |
| `assets/avatars/avatars.json` | Playable avatars and default selection |
| `assets/animations/` | Shared and per-avatar action catalogs and VRMA clips |
| `web-surface/` | Directory and artwork viewer applications |
| `scripts/` | Authoring, validation and export tools |
| `host-integration/` | Legacy reference adapters, not automatic runtime plugins |

## Characters and animation

The avatar catalog has `"default": null` for first-person exploration. Set it to `"pilot"` or `"pilot0"` to choose an automatic avatar on fresh visits. Existing saved preferences still take precedence.

Cyan uses `assets/animations/animations.json`; Amber overrides it with `assets/animations/independent.json`. Both catalogs reference `idle.vrma`, `walk.vrma` and `jump.vrma`. All directional walking and running actions map to the walk clip; movement remains Player-owned. Keep paths relative to their owning catalog and preserve the existing action names. Validate changes with `npm run test:characters` and `npm run test:locomotion`.

## Edit and validate

For authored scene or catalog changes, edit the relevant source data and regenerate where needed:

```sh
npm run generate
npm run check
```

Do not regenerate the scene for documentation-only or character-catalog-only changes. After artwork derivatives change, refresh their catalog with `node scripts/generate-world-texture-profiles.mjs` and commit the result. For permitted new audio, update the soundscape catalog with source, credits and rights metadata. Optional waveform generation uses `python scripts/generate-waveforms.py <track-id>` and FFmpeg; Python is not required at runtime.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Serve the world on port 4174 by default |
| `npm run check` | Run regression tests, validation and bundling |
| `npm run validate` | Validate the world and capability declarations |
| `npm run bundle` | Build the standalone world document |
| `npm run export:review` | Export the allowlisted runtime tree and SHA-256 inventory for review |
| `npm run verify:hosting -- <world-root> <loader-origin>` | Check hosted responses |

`dist/world.anyo.json` alone is not a complete hosted world. Preserve canonical root documents and asset paths. See [hosting](hosting.md) and [rights](rights.md).
