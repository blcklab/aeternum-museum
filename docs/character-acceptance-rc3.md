# RC3 — Author-supplied locomotion clips

- Idle, walk and jump binaries are the exact supplied files. Both avatar catalogs use the same three binaries. Forward, backward, left, right and running all map to the walk clip at its original playback rate. Movement direction and speed are still Player-owned. Jump plays once; the source animation is named Backflip.
- Preview actions remain available: Cyan previews idle, Amber previews walk. Removed the old Mixamo preview clip as well as old directional and run clips to keep exactly three files.
- The first-person aiming reticle is expected when free-pointer orbit is not active. No Loader changes.

## Verification

Full museum npm run check passed on Node 22.16.0 using the recovered pinned Anyo tarball extracted offline. The new locomotion regression test checks all aliases, both preview actions, exactly three VRMA files, and binary validation. Actual M6 Loader HTTP discovery and resource preparation passed for both avatars and six clip references, with disposal. Visual animation retargeting, event marker alignment and live GitHub remain unverified. Public distribution remains subject to asset rights review.

## Applying the small update ZIP

Extract over RC2, then from the museum root in PowerShell remove the six superseded files:

```powershell
Remove-Item assets/animations/walk-forward.vrma, assets/animations/walk-backward.vrma, assets/animations/strafe-left.vrma, assets/animations/strafe-right.vrma, assets/animations/run-forward.vrma, assets/animations/mixamo-idle.vrma -ErrorAction SilentlyContinue
npm run check
```

A fresh full archive already excludes these files.
