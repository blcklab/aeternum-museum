# AETERNUM — U8 character acceptance candidate

Museum package `1.0.0-rc.4`, based on the RC3 U8 candidate. World 0.9 revision 34 remains unchanged. Use the M6 nullable-default Loader update (`0.6.0-rc.1` package version). No changes to the engine, renderer, Player, or animation libraries are needed.

## Run locally

In this museum directory run `npm install` (for authoring checks), `npm run check`, and `npm run dev`. The dev server itself needs only Node. In your working M6 Loader directory run `npm run dev`. Open either:

- WebGL2: http://127.0.0.1:4173/?registryRoot=http%3A%2F%2F127.0.0.1%3A4174%2F&backend=webgl2
- WebGPU: http://127.0.0.1:4173/?registryRoot=http%3A%2F%2F127.0.0.1%3A4174%2F&backend=webgpu

If a port is occupied, use the actual ports printed by the servers. Keep both running. Press I or open Character in the Loader. First-person exploration is the default (`default: null`). Cyan and Amber Museum Scout are optional choices; saved selections take precedence. Both are the original test robots from the M6 acceptance lab. Cyan uses the shared animations catalog and `alphaPreview`; Amber uses `independent.json` and `soloPreview`. The underlying three author-supplied VRMA files are shared, with different preview action maps: Cyan previews idle and Amber previews walk. All directional walk and run actions explicitly map to `walk.vrma` at speed 1; movement speed remains Player-owned. The jump clip is named Backflip in its source. Existing gameplay event hooks remain, with walking markers shared across directions and run; marker alignment has not been visually verified. No museum scenery was replaced and no character was added to the scene document.

## Acceptance

- Check fresh first-person start, both avatar selections, No character and refresh persistence, third-person view, facing, walking/running/jumping, and the distinct preview actions in the Character panel.
- Check reception (M), soundtrack (N), exhibit interaction (E), tours, artwork viewer, footsteps, mobile texture profile, and collision. Test both supported GPU backends.
- Switch to another world and back. Confirm no cross-world avatar/action leakage and the museum preference is restored when returning to the same exact world URL.
- Validate edits with `npm run test:characters` or `npm run check`. Catalog and binary validation is included in the latter. Keep `world.anyo.json` and `anyo.project.json` at repository root; do not load `dist/world.anyo.json` as the canonical remote entry.

## GitHub acceptance (only after distribution rights are cleared)

The museum baseline explicitly records pending artwork/recording rights review. This candidate is not public-release clearance. The three VRMA files are supplied by the author; verify their distribution rights too. The two generated robot models are original test assets. Keep the full museum local/private while the audit is outstanding. A private GitHub repository is not accessible through the Loader's ordinary public jsDelivr route. If necessary, use a separate rights-cleared public test world for U8 instead.

When cleared, commit the tested source and real package lock to a branch (e.g. `u8-characters`); push that branch to the existing public museum repository, then create a fresh `v1.0.0-rc.4` tag on that exact commit and push it. Do not move earlier release tags. GitHub Pages is not required. Keep `node_modules` and `dist` untracked; commit model and clip binaries directly, not Git LFS pointer files. The source already has a manual Pages workflow, but do not run it for this test.

Open the Loader's repository route for your actual owner/repository with `?ref=u8-characters`, then `?ref=v1.0.0-rc.4`. Use the actual Loader origin (local dev is fine). In DevTools Network, inspect the project, world, both catalogs, VRM and VRMA requests: they should use the same explicit jsDelivr repo ref, with real bytes and no redirects/errors. Compare the RC1 or another legacy world. Test navigation, audio and world switching again. Record URLs, commit/tag, backend and results. Simulated ref tests do not substitute for this live acceptance.

## Verification on the supplied candidate

See the RC3 verification note for actual checks. Live GitHub and visual playback remain separate acceptance gates.

RC4: verify no playable model/animation binary requests before selecting a character, then verify both choices and deselection in the same browser. Existing first-person reticle is unchanged.
