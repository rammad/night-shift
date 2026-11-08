# Night Shift

A Little TV office game built with vanilla JavaScript, Canvas 2D and Web Audio.
Stamp forms, scan sheets and position paper under an automatic stapler. The Little
SDK is the **only npm dependency**. No bundler, database, API server or paid service
is needed to build it.

## Start here: what the receiving engineer needs

1. Install **Git**, **Node.js 22+** (includes npm) and **GitHub CLI (`gh`)**.
2. Get GitHub Packages access to **`@kabletv/little-sdk` 0.39.1**. A public GitHub
   repository does **not** make that private package public. Your GitHub account
   needs package access and the `read:packages` scope. Ask the Little/hackathon
   organizer for access if installation returns 401, 403 or package-not-found.
3. Clone this repo into any folder, and open a terminal **in that folder**. It must
   contain `package.json`, `package-lock.json`, `.npmrc` and `index.html`.
4. Follow ONE install block below. Stop and fix any failed command before continuing.

You do not need Little CLI, Java, a TV or a publisher org just to build the files or
play with mouse/keyboard. TV testing and publication are separate steps below.

## 1. Install and prepare the SDK

Run `gh auth login` if this machine is not already signed in to GitHub. Use the
account with Little package access. Then run the block for your shell.

### Windows PowerShell

Use `.cmd` for npm on Windows so PowerShell's script execution policy is irrelevant.

```powershell
node --version
npm.cmd --version
gh auth refresh -h github.com -s read:packages
$env:NODE_AUTH_TOKEN = gh auth token
npm.cmd ci
npm.cmd run setup:sdk
Remove-Item Env:NODE_AUTH_TOKEN
```

### macOS / Linux (bash or zsh)

```sh
node --version
npm --version
gh auth refresh -h github.com -s read:packages
export NODE_AUTH_TOKEN="$(gh auth token)"
npm ci
npm run setup:sdk
unset NODE_AUTH_TOKEN
```

**Success:** `vendor/little.mjs` now exists, and setup prints
`Provisioned ignored vendor/little.mjs from installed SDK.`

`.npmrc` reads the token from the environment. Never paste a token into this repo.
The SDK package is marked `UNLICENSED`, so its binary is excluded from public Git
source and provisioned by the setup command. Local Silkscreen fonts include their
OFL license in `assets/fonts/OFL.txt`.

## 2. Run locally

```sh
npm start
```

On PowerShell use `npm.cmd start`. Leave that terminal running and open
**http://localhost:5173/**. Choose **PLAY WITH REMOTE / KEYBOARD**. Lower the cursor,
then hold Space to open the phone. Mouse or arrow keys move the active hand.

**Success:** you see setup, then the phone, then Stamp → Copy → Staple → a graded
punch card. The full conversation takes 12.5 seconds. `Ctrl+C` stops the server.
There is no hot reload: refresh the browser or relaunch the TV app after edits.

Useful direct links while the server runs:

- http://localhost:5173/?practice=stamp — stamping only.
- http://localhost:5173/?practice=copy — scanning only.
- http://localhost:5173/?practice=staple — stapling only.
- http://localhost:5173/?dev — visible developer controls, including ENABLE CAMERA.

Browser camera testing downloads MediaPipe from its CDN and needs network access.
Little TV uses its host pose service instead. Setup automatically continues after
1.2 seconds of a centered upper body and one visible hand; no calibration required.
Setup displays a basic skeleton from pose tracking; no live video preview or
additional media.camera permission is requested on TV.

## 3. Build the deliverable

From the repo root, after SDK setup:

```sh
npm run package
```

Use `npm.cmd run package` on PowerShell. This single command runs syntax checks,
all unit tests, the static build, and ZIP creation. No token is needed at this stage.

**Success:** all tests pass and these outputs appear:

| Output | Purpose |
| --- | --- |
| `dist/` | Complete static website to deploy |
| `dist/little/manifest.json` | Little's app and permission contract |
| `dist/build-info.json` | Version and SHA-256 hashes of runtime files |
| `release/night-shift-0.2.0.zip` | Deployable website; `index.html` is at ZIP root |
| `release/night-shift-0.2.0.zip.sha256` | Checksum for the ZIP |

The filename follows `package.json`'s version. `dist/` and `release/` are generated
and Git-ignored. The build uses an explicit runtime allowlist: no credentials,
Git history, tests, tools, scratch work or screenshots enter the package.

To inspect the actual build, **stop the dev server first**, then:

```sh
npm run preview
```

Visit http://localhost:5173/ again. This serves `dist/`, not the source files.
Use a second terminal for other commands while a server is running. Do not launch
`npm start` and `npm run preview` on the same port.

Optional checks: `npm test` for rules; `npm run check` for syntax;
`npm run sim` for simulated play across all three jobs.

## 4. Test on a Little TV

Do this only after the local game works. Install the CLI from this repo directory,
while authenticated to the same package registry:

```powershell
# PowerShell; bash/zsh users use export/unset as in section 1 and npm/little without .cmd.
$env:NODE_AUTH_TOKEN = gh auth token
npm.cmd install --global --userconfig .npmrc @kabletv/little-cli@0.32.1
Remove-Item Env:NODE_AUTH_TOKEN
little.cmd login
```

The simulator additionally needs JDK 17+ (Temurin 21 recommended).
Get a **fresh** pairing code from TV Settings → Developer → Pair a computer:

```powershell
little.cmd device pair FRESH-CODE --name hackathon-tv
little.cmd device ls --json
little.cmd manifest validate
little.cmd dev --device hackathon-tv
```

Replace `FRESH-CODE` with the displayed code. Run these from the repo root.
`little dev` starts or reuses the server on 5173 according to `little.config.json`;
you do not need to start a second copy. Keep its terminal open during the test.
The computer and TV must share a reachable LAN, and the TV must use the household
profile associated with your Little account. Approve the camera request on TV.

**Success:** CLI reports `open on hackathon-tv`, and the game appears on the TV.
A working localhost browser alone does not prove the TV can reach the computer.

## 5. Release: run with the laptop off

Little CLI 0.32.1 publishes an **HTTPS URL**, not an APK or an installable/offline ZIP.
The ZIP is for deploying to a static web host. The TV still needs network access
and Little host services, but your development computer can be off.

1. Run `npm run package`.
2. Upload the **contents of `dist/`** to the root of a permanent HTTPS origin.
   Use a root origin, not a `/night-shift/` subfolder. Do not upload the repository.
3. Check that `https://YOUR-HOST/` loads the game and
   `https://YOUR-HOST/little/manifest.json` returns the manifest JSON, not HTML.
   The host must also serve `.js`/`.mjs` as JavaScript, `.css` as CSS and the fonts.
4. Obtain access to a **Little publisher org**. GitHub org access is separate.
5. When ready to release, replace the placeholders and run:

```sh
little manifest validate
little publish --url https://YOUR-HOST --org YOUR-ORG --slug night-shift --status unlisted --channel beta
```

On PowerShell use `little.cmd`. Follow the CLI's origin-verification prompts if
required. This command publishes an unlisted beta; it is not part of the build.
Test that beta on TV with the laptop server stopped before sharing it.

See [the release checklist](docs/RELEASE.md). The runtime ZIP contains the private
SDK; don't attach it or `vendor/little.mjs` to the public source repo/release without
Little's redistribution permission. The public repo should contain source and
these build instructions.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `npm.ps1 cannot be loaded` | Use `npm.cmd` in PowerShell. |
| `gh`/`node` not found | Install the prerequisite and reopen the terminal. |
| `npm ci` gives 401/403/404 for `@kabletv` | Confirm package access, `read:packages`, and any organization SSO authorization; refresh auth and set `NODE_AUTH_TOKEN` again. |
| Missing `vendor/little.mjs` or blank page | Run `npm ci`, then `npm run setup:sdk`, then refresh. |
| `EADDRINUSE` on 5173 | Reuse the existing server or stop it with Ctrl+C. Don't start duplicate servers. |
| Need another port | PowerShell: `$env:PORT='5180'; npm.cmd start`. Bash: `PORT=5180 npm start`. Then use `little dev --device hackathon-tv --app-url http://127.0.0.1:5180`. |
| Preview gives 404 | Run `npm run build` before `npm run preview`. |
| TV times out but localhost works | Check the TV/computer LAN, firewall and selected LAN interface. VPN or virtual-network adapters can select an unreachable address. |
| Camera refuses access | Check the active household profile and camera permission, then relaunch the app. |
| Changes don't show | Rebuild if serving `dist/`; refresh/relaunch. Source dev serving does not auto-reload. |

## Code map

`src/layout.js` owns shared geometry. `src/minigames.js` and `src/shift.js` contain
pure game rules/flow. `src/input.js`, `src/reach.js`, and `src/onboarding.js` handle
controls/readiness. `src/view2d.js` draws the game; `src/sfx.js` synthesizes sound.
`src/main.js` owns the loop/HUD. `little-bridge.js` connects to the SDK.
`src/rating.js` contains grade thresholds. `scripts/` contains build/package tools.

[Official Little docs](https://docs.little.co/docs)
