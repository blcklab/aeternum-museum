# v0.1.27 visitor settings

Use the matching Loader visitor-settings release. Its existing approved popup bridge now accepts a bounded `visitor-settings` message only from the active reception iframe on museum revision 27. The host owns preference storage and calls the public Player view-preference API if available. No arbitrary method names or executable data are accepted. Earlier bridge examples below are historical and do not implement this feature.

# v0.1.22

Apply the matching borderless-directory Loader overlay. Reviewed revisions 21 and 22 are accepted, with the same pinned map and 15 landing positions. Existing URL opt-in is unchanged.

# v0.1.21 physical directory

Use the matching physical-directory Loader update for teleportation. The earlier revision-19 DOM iframe bridge is historical and cannot authorize the new texture companion. The host registers its own canvas implementation via the public createTextureSurface contract for the exact approved app and world URL; the repository companion itself cannot teleport. Keep VITE_AETERNUM_WORLD_URL configured as before. See the Loader's docs/AETERNUM-NAVIGATION.md.

# v0.1.19 companion Loader integration

The separate Loader 0.6.0-rc.1 navigation overlay installs this reviewed bridge into the actual repository iframe mount lifecycle. It requires explicit `VITE_AETERNUM_WORLD_URL` opt-in, a pinned local destination catalog, the exact `reception` app entry, and a ready revision-19 AETERNUM world. The world uses a wall-mounted DOM overlay rather than a physical native-browser texture. No third-party repository code is imported into the host. See the Loader overlay's `docs/AETERNUM-NAVIGATION.md`. The reference code below remains available for other trusted hosts. Live browser/player QA is still required.

# AETERNUM reception: trusted Loader integration (optional)

The world itself is portable JSON. The ordinary `web-surface/reception/` repository app displays the directory without any special host privileges. It sends **room IDs only**, never arbitrary coordinates or executable code. The Travel button remains disabled until an explicit host handshake.

`reception-bridge.mjs` is a **reference host adapter**, not a script automatically executed by World Loader. It uses the Player public `teleport({position, resetMotion, clearInput})` method documented in the Loader's earlier Player handoff. Verify the exact current Player API and eye-height/world-space semantics in the installed Loader before adopting it. No Loader source was modified by this release.

For the DOM iframe route:

1. Review and copy `reception-bridge.mjs` into trusted Loader source, together with a pinned local copy of `web-surface/reception/destinations.json`. Do not dynamically import code or blindly trust destination coordinates supplied by arbitrary public world repositories.
2. In the Loader's existing repository-app registration/mount path, opt in only for the known AETERNUM repository/ref and `reception` app. Install the bridge **after the verified initial iframe load**, on the actual iframe instance owned by the host. Keep the iframe sandbox intact (no `allow-same-origin` needed). Restrict navigation to the reviewed entry; revoke the bridge on navigation, app unmount or world replacement. Never register a general window message listener that accepts teleport from arbitrary apps.
3. Pass the active Player, a trusted directory, and a host-owned predicate that verifies the active world identity/ref and mounted trusted app. With an opaque sandbox origin the exact frame reference and `null` origin must both match; use an exact origin instead if the host deliberately uses a non-opaque app origin. The frame is a trusted app, not a security boundary for untrusted scripts within that app.

```js
import { installReceptionBridge } from './reception-bridge.mjs'
// All variables below are supplied by the host's own verified mount lifecycle.
const dispose = installReceptionBridge({
  iframe: trustedReceptionIframe,
  player: activePlayer,
  navigation: pinnedNavigationCatalog,
  isActiveWorld: () => isReviewedAeternumSessionStillActive(),
})
// call dispose() when replacing the world, changing the iframe, or unmounting
```

The bridge is revoked on subsequent iframe loads and rejects mismatched sender/origin, inactive world, unknown destination, requests before handshake and concurrent requests. The host should restrict the iframe's navigation and disable use while loading/replacing the Player. It does not change the player's camera mode or orientation, and does not implement XR rig travel. The destination coordinates are authored world-space eye-height targets; runtime collision, camera/active-room synchronization and travel need local verification.

Texture/native browser provider routes require their own explicitly trusted message transport; this DOM iframe adapter does not claim to support them. If the current Loader presents only a snapshot, the snapshot is non-interactive. Keep regular walking/navigation available.

## Browser QA

- Open `/web-surface/reception/index.html` on the museum development server. All 15 destinations should be visible; Travel stays disabled outside a connected host.
- Load the museum in World Loader, approach the wall-mounted visitor directory on the west side of the lobby and check its display and input. Use the verified host integration to connect the screen.
- Select each gallery and public area, confirm Travel, verify position, collision, current room, input reset and camera mode. Try both texture profiles. Test world replacement, iframe navigation, and denied/unknown destination. The reference adapter is tested only with mocked host/Player objects in this release.

## M7.2 — Optional HD inspection overlay

The collection website works independently at `/web-surface/artwork-viewer/index.html`. For a reviewed AETERNUM session, a trusted Loader may copy `artwork-viewer.mjs` into its source and instantiate `createArtworkViewer({entryUrl, catalog, isActiveWorld, onOpen, onClose})` with the pinned repository entry and reviewed `web-surface/artwork-viewer/catalog.json`. Do not execute arbitrary world code in the host. Wrap the existing `inspect-exhibit` handler: if `viewer.open(params.exhibitId)` returns true, use the rich viewer; otherwise keep the existing title/copy card. Do not register a duplicate action without checking the current host ownership. Call `viewer.dispose()` on world replacement or unmount. Supply `onOpen`/`onClose` callbacks to release pointer lock, clear movement, suspend and restore host input according to the actual Player lifecycle. The modal is sandboxed (scripts and user-initiated popups only; no same-origin access), and the entry and ID are host-validated. Source links can be opened in ordinary browser mode; sandbox popup behavior depends on browser/host policy. Fullscreen is exposed only when permitted by the browsing context. This is a reference integration, not an installed Loader patch; no teleport integration changes were made.
