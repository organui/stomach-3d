# Anatomy-tree registry integration

The anatomy panel uses the OrganUI registry item `anatomy-tree`, installed with the shadcn CLI. The installed source is tracked in version control; runtime and ordinary setup never contact a registry.

## Exact installation

Installed on 2026-10-16:

```sh
REGISTRY_URL=http://127.0.0.1:4412 bunx shadcn@4.21.0 add http://127.0.0.1:4412/anatomy-tree.json -y -o
```

The build sandbox could not reach `organui.com` or `ui.shadcn.com`. The item was served from a local static server holding the registry output built by `packages/registry/scripts/build.ts` from the OrganUI repository at `master` commit **42dc34f** (organui PR #12, merged), plus shadcn's `colors/neutral.json` from the shadcn GitHub repository. With network access, the equivalent public command is `bunx shadcn@4.21.0 add https://organui.com/r/anatomy-tree.json -y -o`.

| Artifact                                     | SHA-256                                                            |
| -------------------------------------------- | ------------------------------------------------------------------ |
| Served `anatomy-tree.json`                   | `719c1547afb1453e809ee1b2fca0dc99858083aa3ff712477a493c77e8f5f389` |
| Tracked `src/components/ui/anatomy-tree.tsx` | `3d5554cdc179f1ad778fd6321cc1414c293c4cca0535efd9aab679c686893538` |

These match the heart, liver, lungs, kidneys and brain explorers' installs byte for byte. The CLI wrote `@base-ui/react@^1.8.0` to `package.json`; it was restored to the exact `1.8.0` pin. The only difference from the published source is the CLI's removal of `"use client"` for this non-RSC Vite target. The file is listed in `.prettierignore` and must not be hand-edited.

## API used

- `data`: three group rows (`selectable: false`), each with its structure leaves (`color` set to the mesh colour);
- `selectedId` / `onSelectionChange`: the app's single controlled selection;
- `visibility` / `onVisibilityChange`: a map keyed by leaf IDs, where a missing entry means visible;
- `defaultExpandedIds`: all groups;
- `label="Stomach anatomy"` and `className="registry-tree"`.

## Application adapter

Scene-specific logic lives in `src/anatomy-adapter.ts`, built from `structures` and `groups` in `src/anatomy.ts`:

| Tree ID                     | Scene leaves (GLB `structureId`)                                                        |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `group-digestive-tract`     | `stomach`, `esophagus`, `duodenum`                                                      |
| `group-arteries`            | `celiac-trunk`, `left-gastric-artery`, `splenic-artery`, `common-hepatic-artery`        |
| `group-neighbouring-organs` | `spleen`, `pancreas`                                                                    |

Groups are interface groupings only and do not claim anatomical containment. Every leaf ID is exactly one application structure ID and one GLB node. `assertAnatomyMapping` runs at import and throws on missing, unknown, or duplicate leaves; `src/anatomy-adapter.test.ts` covers the adapter.

Behaviour (group rows expand rather than select, Reset remounts the tree, hidden structures are not pickable, and the panel scrolls an existing selection into view when opened) is the same as in heart-3d; see that repository's `docs/REGISTRY_INTEGRATION.md` for the reasoning.
