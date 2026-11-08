# Rigged showcase assets

This directory is isolated from gameplay and backend code. The showcase now loads binary glTF files rather than building primitive objects at runtime.

## Files and editing

- `models/*.glb`: meshes, normals, UV coordinates, materials, skeletal weights, bind matrices and clips. Import into Blender or another glTF-compatible modeling application for manual art refinement.
- `model-source/build-models.mjs`: editable authored cross-sections, outlines, joint placement, weighting and animation keys. Run with Node to rebuild GLBs. Rebuilding overwrites generated GLBs; save manual DCC edits as separate versions.
- `models/manifest.json`: geometry counts and clips.
- `rig-viewer.js`: standalone loading, clip playback, skeleton and wireframe inspection.

Fisherman: 4,236 triangles, 17 joints, Idle/Cast/Chop loops. Fish: 856 triangles each, 5 joints, Swim loops. Rigid tools have root and grip joints, without standalone clips. Attach tools to hand bones when gameplay integration is authorized.

Coordinates: metres, +Y up, character front +Z. Character binds in a relaxed A pose. Animations are local joint rotations in seconds. Up to two joint influences per vertex are currently used. No IK solver or finger rig.

## Current art limits

This is the first authored mesh/rig pass, not final production art. Garment and anatomical sections are separate mesh islands; joints need further deformation polish. UVs are per-section procedural coordinates rather than a packed unique texture atlas. Materials are clean flat colors; sewn patches are geometry. Final painted texture work, closer concept likeness, attachment testing and animation polish remain. Tools now include blade bevels, a full tang and rivets, stamp lettering, parcel ties, rod guides and reel crank. Some details remain stylized approximations. No claim of target-hardware performance has been made.

## Verification

Run `node showcase/model-source/validate-models.mjs` to check all binary bounds, vertex attribute counts, indices, skin weight sums and joint indices. All twelve assets were loaded through the browser viewer; character casting and fish swimming were visually checked. No gameplay/backend files were modified for this pass.

## Color / retro showcase pass

`retro-art.js` provides seven deterministic 64px painted maps (wood, cloth, scales, metal, hair, paper, plain), nearest-neighbor filtering, flat mesh normals and three-band toon lighting. The scene exports a 448x64 source texture sheet. These materials are applied in the showcase; the existing GLB downloads retain their original materials until a DCC bake/export pass.

The scene renders at 300px height by default and upscales with nearest-neighbor sampling. A single full-screen pass provides slow UV warp, edge-weighted RGB separation, and vignette. Drunkenness 0 removes warp and separation; pixelation is independently switchable. HTML controls remain sharp. No extra effects dependency or game/backend change.

Reference: DREDGE official press screenshots, https://www.dredge.game/press-kit . Palette interpretation: deep teal water, plum fabric/shadows, amber mustard, coral fins, pale cream highlights. Original textures only; no DREDGE assets copied.

Blender 5.3 candidate was found in Downloads but returned Windows status 0xC0000022 (access denied) on both --version and background launch, including after folder read permission was granted. No MCP configured, no .blend created, and no Blender export claimed.


## Lanky character and workstation light pass
Character mesh and bind-joint positions share a proportion transform: legs 30% longer below the hips, torso/limb width reduced 13%; added shaped knees, elbows, cuffs, knuckles, sole welts, rear straps and pockets. Materials are batched by color to limit draw calls. Cleaver has 1,900 triangles, with a modeled bevel and full tang; the hanging eye is a dark inset rather than a cut-through hole.
All twelve GLBs rebuilt and validated. Cast animation and cleaver closeup inspected in-browser. Stronger drunken effect defaults to 1.1 on a 0–2 slider; UV roll, warp and RGB split increase together. New hanging bulb has a warm spotlight, local bounce light and one 512px hard shadow map. This adds rendering cost and needs target-device profiling.
