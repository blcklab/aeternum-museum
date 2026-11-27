# Release acceptance checklist — not yet signed off

Record browser/OS/GPU, world and Loader revisions, backend, texture tier and observed outcome. Source tests alone do not establish browser acceptance.

| Area | Required observation | Status |
| --- | --- | --- |
| Desktop WebGPU | Correct artwork orientation, no GPU validation errors; 1x/4x MSAA | Pending |
| Desktop WebGL2 | Correct paintings, labels and reception display | Pending |
| Auto fallback | Recognized failed WebGPU startup falls back to WebGL2 | Pending |
| Android Chrome | Movement, camera, M/N, artwork, portrait/landscape, texture tier | Pending |
| iOS Safari | Touch controls, expanded fullscreen fallback and audio decoding | Pending |
| Navigation | All rooms reachable; teleport and guided tour progress | Pending |
| Accessibility | Text size, contrast, reduced motion, focus and touch targets | Pending |
| Audio | Autoplay, shuffle, pause, volume while playing, seek, credits, popup closure, room changes, footsteps | Pending |
| Lifecycle | Reload/leave stops old audio; no stale popups or GPU resources | Pending |
| Hosting | Exact approved URL, HTTPS, MIME/CORS/ranges, no unintended source exposure | Pending |
| Rights | Artwork and music source/license/attribution reviewed | Pending |

## M8.4 execution

Use the Loader's `docs/AETERNUM-ACCEPTANCE.md` and `npm run test:aeternum:browser` for repeatable acceptance. Run the museum `npm run check`, `npm run export:review`, and `npm run verify:hosting -- <world-root> <loader-origin>` before actual device tests. Record browser/device, exact world URL, build commit and evidence for each case. Do not mark untested cases as passed. M8.2 rights audit remains deferred, not waived.

## M8.5 candidate

The museum package is now `1.0.0-rc.1` for private testing. The world document is still revision 34. See [release candidate notes](release-candidate.md) for promotion gates. No pending acceptance case is cleared by the version bump.
