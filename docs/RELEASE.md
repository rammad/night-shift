# Night Shift release

## Local, reproducible build

Requires Node 22+. The vendored Little SDK and local Silkscreen font are included;
no npm credentials or runtime npm install are needed to build.

```powershell
npm run package
# Optional local production-build check:
$env:PORT = '5180'
npm run preview
```

`dist/` is the deployable static site. `release/night-shift-0.2.0.zip` contains that
site at its archive root, alongside a SHA-256 checksum file. The build uses an
explicit runtime allowlist and includes `build-info.json` with per-file hashes.
Generated artifacts, local work, screenshots and credentials are git-ignored.
Do not commit tokens. Keep the repository's existing private SDK access rules.

## Run without the laptop dev server

Little CLI 0.32.1 publishes an app **URL**, not an installable APK or offline ZIP.
Host the contents of `dist/` at a permanent HTTPS origin. The TV loads the game
from that host; the laptop does not need to be running. This still needs network
access and Little's host services. The ZIP is a deployment artifact, not a TV
sideload package. Browser-webcam testing still downloads MediaPipe; TV gameplay
uses the Little pose service and does not load MediaPipe.

After choosing a host and a Little publisher organization, verify the hosted
`/little/manifest.json`, validate the manifest, then publish an unlisted beta:

```text
little manifest validate
little publish --url https://YOUR-HOST --org YOUR-ORG --slug night-shift --status unlisted --channel beta
```

These are release instructions only. No host deployment, publisher linking,
commit, push or publication has been performed. GitHub org membership is separate
from membership in a Little publisher org.

Before release, test on TV: calibration with each hand, camera permission,
scanner reach, all three jobs exactly once, loss/reacquisition of tracking,
pause/resume, audio clunks and punch-card grades. Use the published beta to verify
launching after the laptop and its dev server are off.

## Rating

Grades use total points divided by the target for the jobs played: stamp 1000,
copy 800, staple 400. A+ ≥95%, A ≥85%, B ≥70%, C ≥50%, D ≥30%, otherwise F.
Fumbles reduce the existing score, so both output and accuracy contribute.
Practice mode uses only that job's target.
