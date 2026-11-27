# Hosting AETERNUM

AETERNUM is a static Anyo world. Rendering happens in the separate World Loader, in the visitor's browser. No museum-specific backend or Loader environment variable is needed with current Loader releases.

**Before public distribution:** verify content rights and attribution; a public repository itself distributes the included binaries. See [content rights](rights.md).

## Direct GitHub repository

Once rights are cleared, push the canonical world files, `anyo.project.json`, `assets/` and `web-surface/` to a public repository. Commit real model and animation binaries, not Git LFS pointers. Keep generated `dist/`, `node_modules/` and local `.internal/` records untracked.

With the Loader running locally, open the repository route. Example URLs (substitute your owner, repository, branch or existing tag):

```text
http://127.0.0.1:4173/blcklab/aeternum-museum?ref=main
http://127.0.0.1:4173/blcklab/aeternum-museum?ref=v1.0.0-rc.4
```

GitHub Pages is not required for repository loading. Use an explicit ref for reproducible testing; do not move existing release tags.

## GitHub Pages (optional)

1. Run `npm install`, `npm run check`, and `npm run export:review`. Commit the real `package-lock.json` and verify `npm ci` in a clean checkout.
2. In repository Settings → Pages, choose GitHub Actions as the source.
3. Once publication rights are confirmed, run **Publish museum to Pages** from the default branch and confirm the rights input. The existing workflow publishes only the review runtime tree plus `docs/pages-index.html` as its landing page.
4. Open the deployed world with the Loader's `registryRoot` query, using the actual Pages URL. Example:

```text
http://127.0.0.1:4173/?registryRoot=https%3A%2F%2Fblcklab.github.io%2Faeternum-museum%2F
```

The museum's Pages landing page is a data-site entry, not a standalone 3D player. Pages replaces the deployed site on updates; it does not provide immutable per-tag URLs by default.

## Other static hosts

Serve the canonical world and project JSON files with `assets/` and `web-surface/` at the same root. Use HTTPS, correct media and module MIME types, cross-origin access (including opaque sandbox origins where needed), and single byte-range support for audio. Do not publish the source checkout or grant credentialed wildcard CORS.

Verify deployed responses using the actual world root and Loader origin:

```sh
npm run verify:hosting -- https://blcklab.github.io/aeternum-museum/ https://blcklab.github.io
```

This is an HTTP smoke test, not a substitute for browser or physical-device acceptance. Test both GPU backends, character selection, navigation, audio, artwork and world switching. Navigation permission is owned by the Loader; a changed or unrecognized snapshot may require approval.
