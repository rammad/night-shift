# Dock Drunk — prototype

Run `npm start`, then open http://localhost:5173 in Chrome or Edge. Node 22+ recommended. Internet required for pinned Three.js / MediaPipe modules and the Pose Lite model. No build or npm install required.

Four 15-second rounds: bait, cast/catch, chop, stamp. Each success awards 100 points. Restart resets the shift. Camera permission is requested only on Enable Camera. Video is processed locally. Switch away from Camera to stop its stream.

Mouse controls right hand; Shift+mouse controls left hand. Hold Space to raise both hands and release to lower. For casting hold 1.5 seconds, release, then press Space when green. For chopping center the left hand, move right hand up and quickly down. Packing selects ink in the upper left/right zones and stamps by dwelling over center.

External adapter: select External then call `window.dockInput.push({left:{x:0.5,y:0.5},right:{x:0.6,y:0.4}})` at 10–30 Hz. Coordinates are normalized screen positions, top-left origin. Input expires after 500 ms. Feed your device through this boundary; gameplay does not depend on MediaPipe.

Rendering is capped at 30 fps at one-third CSS resolution, with low-poly meshes, no shadows or postprocessing passes. Pose sampling defaults to 15 Hz and can be set to 10/30. Current inference is synchronous, so slow devices may stutter; worker inference is a next optimization. No performance claims have been verified on target hardware.

Rough prototype limitations: procedural placeholder scene; bait/cast target uses overlay rather than modeled hook/rod; packing is a static paper placeholder (slide-in/fold animation pending); fish reset is immediate; no audio, calibration or persistence. Shoulder casting currently uses high wrist positions rather than shoulder-relative pose. Chromatic separation is on HUD text only.

Dependencies: Three.js (MIT), MediaPipe tasks-vision (Apache-2.0); model is fetched from Google's official MediaPipe model distribution. See https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js .

Git repository is local. Create an empty GitHub repository, then `git remote add origin YOUR_REPOSITORY_URL` and `git push -u origin main`.
