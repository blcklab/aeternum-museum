# v0.1.27 — M7.7 Visitor settings and accessibility

Install the matching museum and Loader updates over v0.1.26 / Guided Tours. Press **M**, then **Visitor settings**. Change field of view (45–90 degrees), pointer and touch look sensitivity (0.5–2×), or inverted vertical look. Camera options are enabled only when the approved Loader bridge reports a compatible `setViewPreference` API. These are Player view preferences; avatar-specific orbit controls may still use their existing settings. Walking speed is unchanged. Choose standard, large or extra-large directory text, high contrast and reduced interface motion; system reduced-motion preferences are also respected. Apply settings or restore defaults. The directory remains usable without a host (reading settings apply to the current page only). With the trusted host, preferences are saved in Loader-origin browser storage when available and restored when the directory reconnects; if storage is blocked, they remain in the current Loader page session. No new world schema, geometry, artwork, destination, tour, or dependency changes. Run `npm run test:visitor-settings` or `npm run check`. Native schema and compilation and the offline regression suite pass; live browser layout and actual Player camera behavior still require QA.

# v0.1.26 — M7.6 Guided museum tours

Apply the matching museum and Loader updates over v0.1.25 / Global Shortcuts. Press **M**, choose **Guided tours**, and select a journey. Travel to each gallery, find the highlighted work, then press M to continue. The progress counter records confirmed gallery arrivals, not whether an artwork has been viewed. Free exploration and map selection remain available without ending the active tour. End or finish a tour to choose another. A world reload or replacement resets progress. Tours never advance automatically, never move the player without a Travel click, and use the existing reviewed destinations. Four curated routes (17 stops) are authored in `web-surface/reception/tours.json`; each stop is linked to an existing exhibit. The matching Loader has a reviewed copy of this catalog. Run `npm run test:tours` or `npm run check`. No geometry, asset, engine version or shortcut changes. Actual browser travel and UI QA still required.

# v0.1.25 — Global museum directory

Press **M** from anywhere in the loaded museum, or use the **Museum Directory** button in the updated Loader. The same trusted popup opens; press M or Escape to close it, or select a room and travel. The wall display remains unchanged in size and position. This requires the matching World Loader shortcut update. The shortcut is declared in `web-surface/reception/web-surface.json`; no Anyo World schema extension or new dependency is required. Production travel still needs the reviewed world URL configured in the Loader.

## v0.1.24 — Directory orientation and fullscreen compatibility

Corrected the physical directory launcher vertical canvas orientation. Install the matching Loader fullscreen hotfix. Physical placement, artwork, destinations and popup navigation are unchanged. Static fallback and HTML popup remain upright.

# AETERNUM 0.1.23 — directory popup

The borderless physical screen now opens the existing `open-web-popup` action. Select a destination in the normal browser directory and press Travel. Use the matching Loader popup update. Standard localhost development is approved; production needs the exact reviewed `VITE_AETERNUM_WORLD_URL`. Confirmed arrival closes the popup. If pointer lock was released, click the viewport to resume mouse look.

# v0.1.22 — Borderless directory and pointer input hotfix

Removes the external screen housing and positions the existing 4.8 × 2.7 m plane 3 cm from the west wall. The fixed 1920 × 1080 UI accepts down/up and click events, suppresses duplicate activation, and shows hover feedback. Anyo’s existing fixed-rate scheduler refreshes the screen at a requested 8 FPS while active, including readiness changes. Use the matching Loader update for trusted teleportation in revision 22; the repository companion alone remains directory-only. Browser picking and actual travel require local verification.

# v0.1.21 — Physical wall directory hotfix

The directory now requests Anyo native texture presentation (`renderMode: auto`, `presentation.type: texture`), with a front-facing 4.8 × 2.7 m plane and a fixed 1920 × 1080 canvas layout. The repository manifest includes a sandboxed texture companion, using the same protocol as the Loader placement lab. No external browser provider is needed. The original HTML directory remains available for direct browsing; the physical companion is directory-only until the optional trusted Loader adapter is installed. The adapter uses the reviewed local map and destinations, not repository-provided executable code. The approved URL and world revision 21 must match. Camera distance changes perspective, not layout. Actual GPU rendering and input need browser QA. No changes to artwork or other geometry.

# v0.1.19 — M7.5 Wall-mounted navigation

The freestanding reception desk has been removed. The west information wall now combines a compact static gallery index and one 3.6 × 2.025 m landscape Web Surface with a shallow housing. The opposite wing directory, arrival signage, all artwork, and the fifteen existing landing positions remain unchanged. The existing `reception` app ID is retained for compatibility. It intentionally requests `dom-overlay` for the reviewed iframe bridge; the static fallback remains available when Web Surfaces cannot mount.

**Travel is available only with the separate trusted Loader integration.** Apply the companion Loader 0.6.0-rc.1 navigation overlay to that Loader's source, then set `VITE_AETERNUM_WORLD_URL=http://127.0.0.1:4174/world.anyo.json` in its `.env.local` and restart Vite. Only explicitly reviewed world URLs are allowed. For a public deployment, configure the exact reviewed immutable CDN world URL, not a mutable branch. The app remains a directory without opt-in. Browser mounting, input, actual movement and active-room update require local QA. See `host-integration/README.md` and the companion Loader integration instructions.

# v0.1.16 — M7.2 HD artwork viewer

Open `http://127.0.0.1:4174/web-surface/artwork-viewer/index.html` after `npm run dev`. The responsive collection viewer provides title/artist/year search, gallery filtering, previous/next exhibit navigation, fit and original-pixel zoom (up to 400%), mouse-drag and scroll panning, original-resolution metadata, description, credit, rights and source links. Fullscreen is offered when supported. Deep links accept `?exhibit=<entityId>`. Only the selected original artwork is requested; Balanced/HD world texture and Safe/Occlusion profiles remain independent. The generated catalog covers 76 placements of 72 unique artworks; all 74 original files remain unchanged. Cross-listed works intentionally retain separate exhibit IDs. Original-resolution means the existing museum source file, not the full archival master from its external institution.

The ordinary site works without the Loader. For in-world inspection, `host-integration/artwork-viewer.mjs` provides an optional sandboxed modal reference adapter; the existing `inspect-exhibit` card and reception bridge remain unchanged. See `host-integration/README.md` for the trust and input lifecycle contract. No loader source is modified. `npm run test:viewer` checks catalog parity, original asset paths, filtering, zoom math and trusted entry selection. The world document is unchanged except for revision 16.

---

# v0.1.15 — M7.1 Artwork inspection & reception terminal

- All 76 existing `inspect-exhibit` actions retain their title, copy and distance. They now also expose stable exhibit/artwork IDs and catalog metadata, with a generated `assets/museum/inspection.json` index for future rich inspection and HD viewing. The Loader's existing inspection card determines what it actually displays; this release does not replace that card.
- A native reception desk and Web Surface occupy the unused west side bay of the entrance hall. The repository app at `web-surface/reception/` lists all 15 rooms, with a non-interactive snapshot fallback.
- The terminal can be opened directly at `/web-surface/reception/index.html` when running `npm run dev`. **Teleportation is disabled until the trusted host bridge is installed.** See `host-integration/README.md` for the reference adapter and integration/QA contract.
- No new dependencies or changes to the original artwork files. Run `npm run test:interaction` for offline metadata, landing clearance, desk geometry and mocked bridge tests. The existing `npm run check` also invokes this test.

Both texture and visibility profiles remain supported. Real Loader screen mounting, inspection UI and player teleport behavior require browser testing.

---

# v0.1.14 — M6.4 Loading performance

The development server now negotiates Brotli or gzip for compressible files (including world JSON), retains an identity fallback, and revalidates cached responses using ETag/Last-Modified. It serves WebP and other already-compressed image/model files without HTTP recompression. Mutable URLs use `Cache-Control: no-cache` (cacheable but revalidate), not immutable caching; switching profiles or editing the world remains supported. CORS permits conditional requests and exposes validators. Missing/private paths remain uncached and rejected. This requires no new dependency or engine change.

```sh
npm run test:loading
npm run profile:loading
npm run profile:loading -- --json
```

The shipped Balanced + Safe world is 779,707 bytes before HTTP encoding, 50,419 bytes with gzip and 48,012 bytes with Brotli quality 4 in the offline size audit. This is a world-document transfer reduction, not a total cold-load reduction or a measured FPS/startup-time improvement. The 72 unique active artwork URLs and four floor texture URLs are unchanged. Conditional 304 responses save repeat transfers only when the client retains the previous response and sends validators; they do not avoid GPU decoding on their own. The server uses weak stat-based validators and normal HTTP date granularity; ETag takes precedence over dates. Clients that bypass cache still receive full responses.

These HTTP improvements apply to `npm run dev`. Published GitHub/CDN hosting controls its own compression and cache headers. Native runtime lazy loading, progressive texture upload and asset eviction are not enabled by this milestone; the Loader controls those behaviors and they require separate runtime testing. No artwork or geometry changes, no new asset URLs, and no engine upgrades. The `npm run check` chain now includes the standalone HTTP regression test. The incremental update must be merged into the complete v0.1.13 project; the full ZIP is standalone. Official Anyo compiler validation and live startup timing remain local QA items.

---

# v0.1.12 — M6.2 Texture profiles

This release includes all previous architectural and lighting updates. **Balanced is the shipped default**: a maximum long edge of 1536 pixels (67 resized WebP files, quality 90), with five already-smaller exhibited originals reused. All 74 original catalog images and their manifest remain unchanged. There is no runtime transcoder, added npm dependency or engine change.

```sh
npm install
npm run check
npm run dev
```

Select the original resolution (up to 2048 pixels) or the balanced profile, then reload the world in the Loader:

```sh
npm run textures:hd
npm run textures:balanced
npm run profile:textures
npm run profile:textures -- --json
```

Each switch regenerates `world.anyo.json` and saves the choice in `scripts/texture-profile.json`; the selection persists on subsequent `npm run generate`. For public GitHub hosting, commit the generated world and all referenced assets. This is a build-time selection, not automatic device detection or runtime LOD. Same artwork URLs are reused in cross-listed galleries; actual GPU deduplication is renderer-dependent. Texture variants and their source hashes are documented in `assets/museum/texture-variants.json`; original attribution/license is in `assets/museum/manifest.json`. To add large displayed artwork, regenerate derivatives with `python scripts/generate-artwork-variants.py` (Pillow with WebP support is needed only for authoring), then `npm run generate` and `npm run check`. Existing images require no Python to run or switch profiles.

Unique exhibited artwork estimates (RGBA8, no mipmaps): HD 795.2 MiB, Balanced 457.5 MiB (42.5% less); assuming separate allocations for every placement, 842.7 vs 484.2 MiB. Encoded unique source bytes: 63.0 vs 26.1 MiB. These are not measured GPU memory or download totals. Both profiles are present on disk, so the full project archive is larger. Actual network loading, mipmaps, texture sharing and allocation overhead depend on the Loader. Runtime lazy loading and room culling are intentionally deferred to later milestones.

Offline museum tests pass in both modes, original files and derivative dimensions were checked, HD restores all previous entities exactly, and local HTTP HEAD checks passed for every active artwork. Official Anyo validation and live GPU performance have not been executed here; use `npm run check` and test both modes in World Loader.

---

# AETERNUM — BLCK LAB Museum

A walkable, data-driven art and science museum built from the Hello World Anyo World 0.9 starter. The project uses the existing World Loader, not a separate web renderer.

## Start

Requires Node.js 20+. From this folder:

```bash
npm install
npm run check
npm run dev
```

Start your compatible Anyo World Loader separately, then open:

```text
http://localhost:5173/?registryRoot=http%3A%2F%2F127.0.0.1%3A4174%2F
```

The world is also editable in Anyo Editor with `anyo.project.json`. `world.anyo.json` is the actual world entry; no generation or custom server is required for a published repository.

## v0.1.11 — native static geometry optimization (M6.1)

- Explicitly request Anyo's native renderer optimization intent: `staticBatching: true`, `staticBatchMinInstances: 3`, `cachedBounds: true`, `pipelineSorting: true`, `frustumCulling: true`. The renderer/host decides actual eligibility and execution; some options may already be enabled by default. No engine changes or unsupported custom batching pipeline.
- Preserve every authored entity, room, material, light, texture, collision and interaction. No geometry is baked, deleted or merged. The audit finds 2,594 of 2,652 non-colliding plain opaque boxes in 147 candidate room/material groups of at least three. These counts are **not** measured draw calls or guaranteed native batches.
- Compact the generated world JSON with one entity per line, retaining readable top-level sections. World entry size is 778,910 bytes versus 1,314,214 bytes in v0.1.10 (about 40.7% smaller before HTTP compression); parsed entities are unchanged. Generator remains the source of truth. No changes to the artwork catalog or image bytes.
- Run `npm run profile:geometry` to see the room-by-room authoring audit, or `npm run profile:geometry -- --json` for machine-readable counts. It is dependency-free and does not measure frame time or GPU performance.
- Compare v0.1.10 and v0.1.11 on the same Loader/backend, viewport and camera route: entrance, promenade, Renaissance and science galleries. Check FPS/frame time and, if exposed by the host, draw calls/instanced batches, while checking frame appearance, light transitions, collisions and artwork inspection. Actual native validation and live renderer QA remain required; no measured speedup is claimed. Leave occlusion, streaming, light budgets, texture resizing and room visibility policy for later milestones.

Use the complete standalone ZIP, or extract the update directly over your complete **v0.1.10** project (not a standalone folder). Run `npm install`, `npm run check`, and `npm run dev`. Next: M6.2 texture memory optimization, with original HD images retained.

## v0.1.10 — cinematic lighting (M5 first pass)

- 21 existing point-light positions retained with tuned fill intensity, explicit range and gallery-sensitive warm/neutral/cool colors. Global ambient intensity reduced from 0.65 to 0.43; environment diffuse intensity from 0.55 to 0.44; directional sun intensity from 0.35 to 0.06. ACES exposure is unchanged.
- 34 native World 0.9 spotlights wash occupied exhibit walls and one spot washes the lobby identity wall. Each gallery has at most three authored spots. Directions and outer cone/range are computed from the artwork group bounds, with soft inner cones; actual brightness must be checked visually. Selected ceiling fixtures provide the light origins. Diffuser emissive intensity increases from 0.65 to 0.85.
- No additional mesh geometry, texture files or dependencies. All 2,991 existing non-light entities, 76 exhibit placements, room definitions, 74 paintings and the registered floor textures are unchanged. Total: 3,047 entities, including 56 authored point/spot lights. Sekai64 selects a limited active subset; authoring counts are not simultaneous GPU light counts. No spot shadows, bloom or baked lighting added. Image and text entity rendering remains unchanged; wall/frame illumination is the intended effect, not a guarantee that unlit images respond to light.
- Offline checks cover light directions, cones/ranges, geometry clearance, gallery authoring budget, coverage of all exhibit bounds, asset references and prior architectural regressions. These are numerical tests, not photometric measurements or a live GPU preview.

Use the standalone ZIP, or merge the update into the complete **v0.1.9** project. Run `npm install`, `npm run check`, `npm run dev`. Requires a World 0.9-compatible Loader with native spotlight support. Check artwork readability, corridor brightness, floor appearance, light transitions between rooms and FPS. Sekai64's light selection and lack of spotlight shadow support in the earlier validated baseline may cause light spill or transitions; shadows remain deliberately off. The pinned engine is unavailable here, so official validation and live rendering remain unverified. If the Loader rejects spotlights, record its Anyo/Sekai64 versions and exact diagnostic. Next: local lighting QA, then M6 performance optimization.

## v0.1.9 — grand entrance hall (M4.8)

- Monumental south identity wall: dark panel, four restrained bronze perimeter bars, large AETERNUM title, BLCK LAB branding, subtitle, motto and catalog-derived collection counts.
- Forward arrival composition: the existing gateway sign now identifies AETERNUM and the Grand Promenade. Two smaller plaques flank the doorway and state the actual west/east gallery counts and directions. Both full wing directories stay in place.
- Two low, collidable seats in the rear side bays, outside the central route and player spawn. The 14 × 12 m lobby shell, four columns, ceiling, flooring and functional lights remain unchanged. All other rooms, gallery signs, frames, descriptions and artwork remain unchanged. No new assets or dependencies.
- 19 new native entities, total 3,012. The three existing welcome text entities and gateway sign are redesigned. No new wall shells, floor overlays or additional lights. The identity panel is the visual focal point, rather than a freestanding sculpture in the circulation route.
- Offline checks cover the catalog-derived signs, panel and text bounds, doorway and spawn clearance, seat collision intent, solid separation and previous geometry/asset regressions. The actual Anyo compiler, text appearance, player collision and rendering performance still require local verification.

Use the complete standalone ZIP, or apply the update over the complete **v0.1.8** project. Run `npm install`, `npm run check`, `npm run dev`. Reload in World Loader and inspect the forward gateway, rear identity wall and seating. Back up manual edits before overwriting generated files. Next: M5 cinematic museum lighting.

## v0.1.8 — gallery typography and wayfinding (M4.7)

- All 13 galleries have two-row signs on both sides of their doorway: full gallery names, gallery numbers and actual exhibit counts on the corridor side; return-to-promenade directions on the gallery side. The existing sign backplates and room architecture remain unchanged.
- Two wall-mounted lobby directories list the west/left (odd-numbered) and east/right (even-numbered) galleries when facing the promenade from the lobby. The directory is generated from the catalog; no separate list to maintain. The main entrance and far-end signs clarify navigation, and the existing artwork title/credit weights are refined without changing copy or placement.
- 47 additional sign parts (45 net new entities, including two non-colliding directory backplates). Total: 2,993 entities. All 76 artwork images/placements, frame geometry, 74 WebP files, floor materials and their four registered texture assets, room geometry, lighting and engine pin remain unchanged. No new dependencies or texture files.
- Offline regression tests verify the sign contents, actual gallery wing and doorway mapping, exhibit counts, sign panel/text clearance, previous geometry/asset checks and repeatable generation. Native Anyo compiler and live rendering have not been executed here; check text fit and visibility from both walking directions in World Loader.

The full ZIP is standalone. The small update ZIP must be extracted **into the existing complete v0.1.7 project**, not started on its own. Run `npm install`, `npm run check`, and `npm run dev` from the complete project root. Back up any local manual edits before overwriting generated files. Next: M4.8 grand entrance hall redesign.

## v0.1.7 — flooring asset registry hotfix

Fixes `ANYO_MATERIAL_ASSET_NOT_FOUND` reported by Anyo Player. The four floor textures are registered as native `texture` assets; all five floor materials reference their asset IDs instead of direct paths. No geometry, artwork, light, texture bytes or engine dependency changes. The update includes the four existing floor WebP files to cover installations missing those files.

Apply over v0.1.6, run `npm run check`, restart `npm run dev`, and reload the world. The project-level regression test checks material texture references against the registry and local files. Official engine validation and browser loading must still be verified locally. M4.7 typography is deferred until this hotfix is confirmed.

## v0.1.6 — period-sensitive artwork frames (M4.6)

- All 76 exhibit placements now have stepped physical frame profiles: 45 classical gilt, 10 warm oak (Impressionism), 17 antique bronze (science/philosophy galleries), and 4 graphite float frames (catalog dark-frame preference takes precedence).
- The original frame footprint and image/label positions remain unchanged. Backing and rebate support sit behind the original image; raised rail tiers surround the image with a 5–12 mm clear aperture margin. Front rim is 28 mm forward of the image plane. These are stepped box moldings, not rounded bevels, carved ornament or glass overlays.
- 788 additional non-colliding native box entities; 152 backing/liner entities updated. Total: 2,948 entities. All remaining 2,008 baseline entities, room definitions, functional lights, texture assets and original exhibit index are unchanged. No new textures, dependencies or engine changes.
- Offline tests check frame aperture, solid separation, depth, envelope, label clearance, profile counts, primitive budget and all previous architecture/asset regressions. Native compiler validation and actual GPU performance, lighting appearance, oblique-angle frame occlusion and artwork picking remain unverified. These additional primitives may increase rendering cost; measure in the Loader before adding more detail.

Apply the update ZIP over **v0.1.5**, then run `npm run check` and `npm run dev`. Reload the Loader. Inspect close-up frames and labels, artwork interactions, wall seams and frame rate. Next: gallery entrance typography (M4.7).

## v0.1.5 — ceiling architecture and fixtures (M4.5)

- Added 35 shallow applied coffer bays: seven along the promenade, two in the lobby, and two in each gallery. The original ceiling slab remains in place; the inset appearance is created by raised perimeter ribs rather than cutting the slab.
- Added 35 linear fixture housings and diffusers, plus 26 gallery tracks with 78 decorative heads. Bronze, pale stone and graphite finishes follow the existing room palette.
- Replaced the 21 simple legacy fixture bars. All 21 actual point-light entities, their color/intensity and the environment lighting settings are unchanged. Emissive diffusers are visible geometry, not additional light sources; aimed lights and cinematic tuning are deferred to M5.
- 427 new non-colliding box primitives replace the 21 old fixture bars, bringing the entity count from 1,754 to 2,160. No new textures, external models, runtime dependencies or engine changes. All artwork, floor assets, building definitions and exhibit placements are unchanged.
- Offline checks verify all prior regressions, room/ceiling bounds, doorway head clearance, separation from existing boxes and point lights, non-intersection of new ceiling solids, fixture counts and deterministic generation. The native compiler and live renderer have not been tested here. The additional draw-call/GPU cost is not measured.

Apply the update ZIP over **v0.1.4**, then run `npm run check` and `npm run dev`. Reload in World Loader and inspect the coffer seams, track fixtures and overall brightness. The next milestone is M4.6, refined artwork frames.

## v0.1.4 — columns, pilasters and wall panels (M4.4)

- Four freestanding, square classical columns define the lobby perimeter without narrowing the central route. Plinths, feet and shafts are collidable; elevated necks and capitals are decorative.
- 105 stepped wall pilasters, including a matched pair at each of the 13 gallery entrances. Placement derives from the clear wall bays after accounting for openings, art frames, labels, signs and trim. Period-sensitive wood, limestone and stone finishes are used.
- 84 low-profile wall-panel outlines on quieter circulation walls, not on exhibition walls. Raised rails have non-overlapping joins. Wall details are non-colliding and have deliberate surface clearance.
- The 873 pre-existing entities, all 15 rooms, 76 exhibits, 74 artwork images, four floor textures and their materials are unchanged. 881 new native box entities bring the total to 1,754; no new texture assets, npm dependencies or engine changes. Live performance of the added geometry has not been measured.
- Local checks verify the projected decoration bounds, opening and artwork/label clearance, room coverage, central lobby route, collision flags and deterministic generation. They do not execute the Anyo compiler, physics or renderer.

Apply the update ZIP over **v0.1.3** (overwrite the five included files). Run `npm run check`, then `npm run dev`, and reload the Loader. Check the four lobby columns, paired gallery entrance pilasters, wall-panel joints, room navigation and rendering performance. If you edited your world manually, back up those changes before replacing the generated world. Official engine validation and live rendering are unverified here. Next planned pass: ceiling recesses and architectural lighting fixtures (M4.5).

## v0.1.3 — floor materials (M4.3)

- Ivory marble in the entrance and promenade, herringbone oak in classical/art galleries (including Philosophy & Reason), pale limestone in Impressionism and Modern Art, charcoal stone in Science, Cosmos, Mathematics, Einstein and Architects of Reality.
- Four original 1024×1024 procedural WebP textures, with repeat wrapping and texture scale derived from room dimensions; different scalar roughness for wood, marble and stone. These are base-color maps, not photographic scans or reflective/normal-map simulations.
- Materials apply to the existing native floor slabs. No overlay planes, new colliders, room layout or exhibit changes. All 873 entities and 74 artwork files are unchanged.
- The included Python texture generator is optional and only needed to regenerate the four texture files (NumPy and Pillow); no new npm or runtime dependency. The generated textures and world JSON are ready to serve.
- Apply the update ZIP over **v0.1.2**. Run `npm run check`, then `npm run dev` and reload the Loader. Inspect floor scale/orientation, repetition, lighting and the transitions at the doorways. The official Anyo compiler and browser rendering are not validated in this environment. Next: columns and pilasters (M4.4).

## v0.1.2 — architectural detailing (M4.2)

- Added low-profile stepped baseboards and ceiling cornices to every room, with dark wood tones in classical/science galleries, limestone tones in the lighter galleries, and stone tones in the promenade/lobby.
- Baseboards split around door openings; bronze-toned door jambs and lintels surround the clear opening on both sides. Decorative boxes have collision disabled. Corner reveals prevent crossing trim runs.
- Added dark, slightly recessed sign backplates for gallery entrances and the lobby directory. Existing sign text is preserved and placed in front of the backplates.
- Kept native room attachments, all door locations, lighting, existing paintings and frames, art metadata, and the engine dependency unchanged. No external textures or runtime code added.
- New offline tests verify trim bounds, clear door apertures, physical separation from exhibit frames, material references and deterministic generation. This is not a native compiler or live rendering test.

Apply the update ZIP to the **v0.1.1** project root, replacing the included files. Run `npm run check`, then `npm run dev`. The generated world is included; no need to regenerate unless editing the catalog or generator. Inspect the corridor/room seams, both sides of the portal casings, trim corners, sign readability and frame clearances in the Loader. No claim of a confirmed rendering fix until this visual check is complete. Next planned pass: flooring materials and textures (M4.3).

## v0.1.1 — shared-wall correction

The v0.1.0 Loader screenshot showed striped/flickering walls consistent with overlapping coplanar room surfaces. The old generator authored every room independently even where its walls coincided with the promenade and adjacent galleries.

- The promenade is now the root room. The lobby and all 13 galleries attach to it with native zero-gap `attachTo` definitions, intended to use Anyo's shared-wall clipping (the parent retains the wall).
- Gallery depth is 11.5 m on a 12 m pitch; neighboring gallery shells are separated by 0.5 m, greater than the 0.16 m wall thickness. The corridor and all doorway centers are unchanged.
- Doorways, display counts and the source image bytes are unchanged. Gallery-side shared walls inherit the promenade finish.
- Image and text offsets are slightly increased; gallery signs are larger. These are precautionary clearance/readability changes, not a verified fix for any independent text renderer issue.
- The local regression checks resolve the attachment positions and reject any unowned coincident wall or overlapping adjacent wall shells. They do not execute the native wall compiler.

No engine versions changed. Run `npm run check`, reload in World Loader and inspect the promenade from both directions, enter every gallery, and check signs and image frames. Live rendering remains unverified here.

## Museum

- One ground floor with a lobby, central promenade and 13 galleries.
- 74 source WebP images, 72 enabled unique artworks and 76 exhibits (four cross-listed artworks appear twice without duplicate image files).
- Physical backing/frame geometry, wall labels, benches, and warm lighting. Exhibition dimensions are normalized for virtual presentation, not original physical dimensions.
- Native `image` entities use the existing `inspect-exhibit` action with `title` and `copy` parameters. The Loader must register this trusted action to open the information card. Static title/artist/date labels are present regardless.
- Two unsuitable photographs remain archived but are not displayed. Source notes, licenses and credits remain in the catalog. Verify reproduction rights and curatorial attribution before public exhibition.

## Project structure

```text
anyo.project.json
world.anyo.json
assets/museum/
  manifest.json          # full artwork metadata, original checksums and rights
  descriptions.txt       # human-readable catalog
  exhibits.json          # generated category/room/entity mapping
  paintings/             # original WebP files from the supplied asset pack
scripts/
  world-base.json        # unchanged starter world as generation baseline
  generate-museum.mjs    # native scene generation
  test-museum.mjs        # offline integrity/layout checks
  validate.mjs           # starter's official Anyo validator
  bundle.mjs             # starter's official native bundle command
  dev.mjs                # starter's static dev server
  anyo-documents.mjs
```

## Update the collection

Edit `assets/museum/manifest.json` and add the corresponding WebP files. Keep image dimensions, SHA-256 and bytes accurate. Category `artworkIds` controls placement; disabled artworks are skipped. The current design allows up to 12 enabled exhibits per gallery; expand the layout if you need more. Run `npm run generate`, then `npm run check`. The generator overwrites `world.anyo.json` and `exhibits.json`; edit the generator for persistent layout changes, or edit the generated world manually and do not regenerate. The offline test includes a deterministic generation check and will fail if the generated world has been edited manually without overwriting your edits.

## Publish

Push the project files to a public GitHub repository. Keep the root entry and assets together; do not publish only `dist/world.anyo.json`. Enter `OWNER/REPOSITORY` in World Loader. No engine changes, backend fields, or runtime dependency installation in the museum repository are needed to serve its JSON/assets. The actual Loader must support World 0.9 and the existing inspect-exhibit action.

## Validation status

Offline museum checks passed for all original image bytes/hashes, entity IDs, references, gallery counts, placement spacing, connected room/portal geometry and deterministic generation. The Anyo package registry is not reachable in the build environment, so official `npm run validate` and `npm run bundle` and live browser/Editor rendering have NOT been verified. The original pinned dependency (`@blcklab/anyo@0.11.0-rc.37`) and validator are retained unchanged. Run the official checks before publishing; verify wall alignment, textures, collision, lighting, labels and interaction in the Loader. The 74 source images remain unchanged (~66.8 MB), including images above 1 MB; no loading/performance benchmark is claimed.

## M6.3 — Room visibility and occlusion (v0.1.13)

The museum has a hub-and-spoke portal graph: all 13 galleries and the lobby
connect directly to the Grand Promenade. The graph diameter is two. A one-hop
cutoff would remove the opposite gallery even when visible through two open
portals. Do not use it for this layout. Two-hop reachability keeps all 15 rooms
eligible; it does not, on its own, reduce their count in the fully open museum.

The default `safe` profile retains frustum culling and native batching with
explicit two-hop portal visibility. It disables optional Hi-Z occlusion. The
`occlusion` profile requests Sekai64's existing conservative hierarchical
occlusion feature (128 resolution, three history frames, minimum 4 pixels).
This is opt-in pending browser QA; it is not an engine modification and host
policy or backend capabilities may override or ignore the request.

```sh
npm run profile:visibility
npm run profile:visibility -- --json
npm run visibility:occlusion
npm run visibility:safe
```

Reload the world in the Loader after changing profiles. Texture profile choices
remain independent. Neither profile changes entities, artwork, collisions,
materials or lights. No texture unloading or actual GPU draw-call reduction is
claimed from the graph audit. Compare identical camera paths and texture
profiles in the Loader, inspecting frame time/draw calls and checking for
missing walls, frames, pictures, light transitions and pop-in at gallery
doors. Test looking across paired doorways, walking along the promenade,
turning quickly and returning to the entrance. Restore `safe` if artifacts or
regressions appear. Native runtime validation is required before declaring
occlusion production-ready.

## v0.1.17 — M7.3 Artist encyclopedia

The HD artwork viewer now includes artist context, plus a separate searchable artist encyclopedia at `/web-surface/artwork-viewer/artists.html`. Explore 49 artist credits, chronological or alphabetical sorting, artistic movement filters, introductory biographies and looking-closer notes. Related works link to the existing original-resolution viewer using exhibit IDs. Cross-listed works are deduplicated within each profile, while every gallery placement is retained in the listing.

Edit `assets/museum/artist-profiles.json` to maintain editorial content, then run `npm run generate`. The generator checks artist coverage and derives the artist-to-artwork relationships from the existing exhibit catalog. No extra npm packages or network calls are required at runtime. Run `npm run test:encyclopedia` for offline validation.

The biographies are concise editorial introductions, not a fully peer-reviewed or comprehensively cited scholarly encyclopedia. Dates for poorly documented early artists use approximate dates or activity periods; the timeline uses approximate birth/activity years. Selected institutional references are included in the profile data. Artwork rights and provenance are unchanged. The existing in-world inspection card, reception Web Surface and trusted host adapters remain backward compatible; actual in-world viewer and teleport integration still require the Loader-side installation described in `host-integration/README.md`.

Selected scientific portraits also show subject notes for Newton, Einstein, Tesla and the Lavoisiers. Edit `assets/museum/science-context.json` to maintain those notes.

## v0.1.18 — M7.4 Interactive museum map

The existing reception Web Surface now combines a scaled, north-up SVG floor plan with its destination directory. Select any room on the map or in the list to highlight the same destination, display its exhibit count, and draw a suggested route from the entrance reference point to its existing landing position. Keyboard selection is supported. The entrance marker is fixed, **not live player tracking**. The route is a guide, not turn-by-turn locomotion or a runtime pathfinder.

The floor plan (`web-surface/reception/map.json`) is generated from the resolved room positions, dimensions and open portal geometry by `npm run generate`. The existing `destinations.json` and trusted host protocol are unchanged; the travel button remains disabled until the Loader bridge connects. If the map cannot load, the destination list remains available. The static reception snapshot is unchanged and remains a non-interactive directory fallback.

Run `npm run test:map` to verify geometry, portal correspondence, suggested route containment, landing positions and clearance from solid boxes. Preview at `/web-surface/reception/index.html` with `npm run dev`. The same app is mounted by the existing reception screen; the world geometry, lighting, original artworks and texture/visibility profiles are unchanged. Runtime Loader mounting, visual/input QA and actual teleportation remain local verification items.

### v0.1.28 — Neirox Soundscapes (M7.8.1–4)

Use the matching World Loader Soundscapes update. Press N anywhere in the approved museum to open the host music popup, then choose Play. M still opens the visitor directory. The Loader owns the persistent Neirox player and bundled soundtrack; no new museum runtime dependency or geometry change is required. Install Loader dependencies again to obtain `neirox@0.3.0`. Volume is saved locally; audio is off until the visitor starts it. The soundtrack is independent of gallery transitions. Spatial sound, footsteps, and actual browser QA remain outstanding.

### Soundscapes (0.1.29)

The world repository owns `assets/audio/soundscapes.json` and its MP3 soundtrack / Ogg room tones. Press N in a compatible World Loader to play the music or explicitly enable room ambience. Edit the catalog and replace/add approved media files with simple lowercase filenames. The manifest is relative to `world.anyo.json`, not the Loader origin. The original synthesis scripts are optional authoring tools; no runtime Python is required. Deploy the complete repository (not only `dist/world.anyo.json`), with CORS for media and manifest requests. The dev server supports single byte ranges for audio seeking. The 15 room IDs are mapped to three independent sound zones; footsteps are not included. Audio remains off until enabled by the visitor.

### Soundscapes (0.1.30): adding music

The playlist is authored in `assets/audio/soundscapes.json`. Copy an MP3 you are authorized to distribute into `assets/audio/`, then append an entry with a unique lowercase `id`, `title`, `artist`, and lowercase hyphenated `file`. No Loader changes are needed to add tracks (up to 64). For example:

```json
{"id":"new-piece","title":"New piece","artist":"Artist","file":"new-piece.mp3"}
```

Optional `credit` and `rights` fields retain recording attribution and release notes. For fast visualizations, optionally run `python scripts/generate-waveforms.py new-piece` (requires ffmpeg). This generates a small audio-derived `.waveform.json` and writes the optional `waveform` field into the manifest. Without it the player can try browser-side waveform analysis; if that fails, playback remains usable. Keep the manifest, audio and optional waveform on the same world asset origin with CORS enabled. The waveform is synchronized to playback time, not a real-time FFT. The Loader still uses Neirox 0.3.0.

**Release note:** the supplied Bach piano recording is included for local review. Its embedded metadata says © 2024 Gregor Quendel, all rights reserved. Confirm distribution permission or remove the recording, its waveform, and the manifest entry before public deployment. The three original AETERNUM tracks and room loops remain available.

### Soundscapes (0.1.31): credits and autoplay

Set the top-level `autoplay` boolean in `assets/audio/soundscapes.json` to `true` for music on the first eligible visitor gesture after the player is ready; `false` (default) starts silently. The N-key popup has a saved local override and a reset to the world default. Browser autoplay restrictions apply; if blocked, press Play manually. Manual pause is respected during the same world session. Room ambience is independent.

Optional track fields: `description`, `credit`, `rights`, `license`. The Bach recording is marked CC BY-NC 4.0 as supplied by the user, with Gregor Quendel / Classicals.de attribution and https://creativecommons.org/licenses/by-nc/4.0/. The MP3 is unmodified. Confirm the exact source and license before public deployment, including the embedded copyright notice. Noncommercial use only under that license.

### Soundscapes (0.1.32): classical collection

The soundtrack contains Bach and Beethoven only. The three former ambient music tracks and waveform files are removed; room ambience is independent and retained. `autoplay: true` and `shuffle: true` are the world defaults. Autoplay remains gesture-gated and honors saved visitor overrides; choose World default (On) to reset an earlier Off override. Shuffle is passed to Neirox, and playlist looping remains enabled. Both recording licenses are user-supplied CC BY-NC 4.0 and require verification before public deployment.

### Soundscapes (0.1.33): surface-aware footsteps

The optional `footsteps` section of `assets/audio/soundscapes.json` maps each room ID to a surface ID. Each surface has a `files` array of 1–4 local lowercase Ogg filenames. Four surfaces mirror the actual room floor finishes (marble, oak, limestone and stone). The eight short original footfall samples are generated by `scripts/generate-footsteps.py`; Python, NumPy and FFmpeg are authoring tools only. In the matching Loader, open N → Footsteps → Enable footsteps. The volume slider is separate from music and room ambience; its value is saved, but footsteps are opt-in each session. The Loader samples grounded locomotion feet, not camera position, and suppresses discontinuous movement, popup travel, hidden tabs and air movement. Listener-local left/right spatialization uses Web Audio HRTF when available; this is not a complete world-space acoustic simulation. Test both camera modes and mobile playback in a real browser. Classical playlist autoplay, shuffle and looping are unchanged.

### Mobile artwork textures (v0.1.34)

The world includes 1024px (`mobile`) and 768px (`mobile-low`) long-edge WebP derivatives of exhibited artwork, with no upscaling. World Loader selects these before loading on mobile Auto; desktop and manual presets use the authored HD or balanced profile. The HD artwork viewer always retains originals. Switch presets and reload the world to change texture tier. `python scripts/generate-mobile-textures.py` regenerates both tiers from checksum-verified originals (Pillow required only for authoring); run `npm run generate` afterward and `npm run check`. `npm run profile:textures` compares estimated decoded RGBA8 and encoded bytes, not actual GPU usage. Publish the entire `assets/museum/variants/` directory with the world.
