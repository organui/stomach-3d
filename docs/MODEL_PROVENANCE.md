# Model provenance and preparation

## Source and license

The runtime model is a curated subset of **BodyParts3D 3.0** (release `20110915`, archive `BodyParts3D_3.0_obj_95`), the same anatomy database the other OrganUI explorers use.

The official LSDB archive host (`dbarchive.biosciencedbc.jp`) was not reachable from the build sandbox. The geometry was therefore taken from the public [Kevin-Mattheus-Moerman/BodyParts3D](https://github.com/Kevin-Mattheus-Moerman/BodyParts3D) repository, which holds the 3.0 OBJ files converted one-to-one to binary STL and named by FMA concept. The mirror is pinned at commit **`f0eeb6e843380cfe6b83797cf8c3e1af74de5e61`**; every input is fetched from that immutable commit and checked against its SHA-256 in [model-inputs.json](../scripts/model-inputs.json) before conversion.

The mirror distributes the data under the license that accompanied the 3.0 release, **[CC BY-SA 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en)**, and asks for this credit:

> BodyParts3D, © The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan.

Its license notice is preserved as inert text in [model-source/mirror-LICENSE_content.txt](model-source/mirror-LICENSE_content.txt) (SHA-256 `0e26340c8fadac4a0478d23dd12f4cb20b4043c436d0ab95eacb062391a7ec84`). The heart and liver explorers rely on the archive's newer CC BY 4.0 grant for files downloaded directly from the archive. This repository did not download from the archive, so it uses the more restrictive share-alike terms that travel with the mirrored files, matching the lungs and pancreas explorers. `stomach.glb` and screenshots of it are adaptations under CC BY-SA 2.1 Japan; the application code remains MIT.

Authoritative references:

- [BodyParts3D archive download page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html) and [license page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
- Archive DOI [10.18908/lsdba.nbdc00837-000](https://doi.org/10.18908/lsdba.nbdc00837-000)
- Mitsuhashi et al. (2009), [doi:10.1093/nar/gkn613](https://doi.org/10.1093/nar/gkn613)

## Selection

The 3.0 release provides the stomach as **one surface** (FMA7148). Its regions (cardia, fundus, body, pyloric antrum and canal) and wall layers have no separate meshes, so the explorer does not split them or draw invented boundaries. To make the stomach's position and supply explorable, the selection adds its immediate tract neighbours, the celiac arterial supply, and two landmark organs. The liver (which has its own explorer), diaphragm, aorta and veins are omitted.

| Display name | Group | Source concept | Mirror file | Source triangles | Kept |
| --- | --- | --- | --- | ---: | ---: |
| Stomach | Digestive tract | FMA7148 stomach | `stl/FMA7148.stl` | 9,384 | 9,384 |
| Esophagus (lower part) | Digestive tract | FMA7131 esophagus | `stl/FMA7131.stl` | 2,642 | 1,433 |
| Duodenum | Digestive tract | FMA7206 duodenum | `stl/FMA7206.stl` | 11,950 | 11,950 |
| Celiac trunk | Arteries | FMA50737 celiac artery | `stl/FMA50737.stl` | 454 | 454 |
| Left gastric artery | Arteries | FMA14768 left gastric artery | `stl/FMA14768.stl` | 232 | 232 |
| Splenic artery | Arteries | FMA14773 splenic artery | `stl/FMA14773.stl` | 3,326 | 3,326 |
| Common hepatic artery | Arteries | FMA14771 common hepatic artery | `stl/FMA14771.stl` | 808 | 808 |
| Spleen | Neighbouring organs | FMA7196 spleen | `stl/FMA7196.stl` | 9,016 | 9,016 |
| Pancreas | Neighbouring organs | FMA7198 pancreas | `stl/FMA7198nsn.stl` | 11,414 | 11,414 |

Names are checked against the release's `parts_list_e.txt` (also pinned) during preparation; a mismatch stops the build. The pancreas file is the release's `FMA7198nsn` primitive, the single part composing FMA7198 in `composite_parts.txt`. These are source mappings, not a claim of expert anatomical review.

The esophagus runs from the neck to the stomach. Keeping all of it would stretch the frame upward by roughly 25 cm, so triangles with any vertex above source height **1250 mm** are removed, leaving about 8 cm above the cardia. The cut end is open. Vessel ends are truncated in the source.

## Reproduce the runtime asset

`public/models/stomach.glb` (1.16 MB) is checked in; ordinary setup downloads nothing. To regenerate it:

```sh
bun install --frozen-lockfile
bun run prepare:model
bun run verify:model
```

The script downloads pinned inputs into ignored `.asset-cache/` only when absent and refuses any checksum mismatch. Steps:

1. Verify every input's SHA-256 and every structure's source name.
2. Parse binary STL triangles (rejecting non-finite values or malformed files).
3. Trim the esophagus as described above.
4. Center the selection on its combined bounding box, map `(x,y,z)` to `(x,z,-y)` and multiply by `0.02`, the same arbitrary display scale as the heart. Viewer +x is patient-left, +y superior, +z anterior. The exact center and bounds are in the manifest.
5. Weld exactly coincident STL vertices, recompute smooth normals, and assign illustrative colors. No decimation or sculpting.
6. Write one GLB node per structure carrying its structure ID and FMA ID, and write [manifest.json](../public/models/manifest.json) with input, per-structure and output hashes.

`bun run verify:model` decodes the runtime, checks its hash and every structure/FMA pair, and validates geometry and indices.

## Anatomy text and review

Descriptions and tour text are original concise summaries of standard introductory anatomy. In-app "further reading" links point to the US NIDDK [digestive system overview](https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works); that page could not be re-opened from the build sandbox, so the text was not checked against it line by line.

Completed: source identifier and name checks, mesh inspection, and interface checks in Chromium on desktop and mobile layouts. **Not completed: review by a clinical anatomy expert or any clinical validation.** The app and README disclose this.
