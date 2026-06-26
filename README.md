# qdmr-web

A browser-only single-page app to manage amateur-radio codeplugs / repeater lists
around the [qDMR extensible (YAML) codeplug format](https://static.dm3mat.de/qdmr/manual/ch03.html).
Import, organize, edit and merge codeplugs; export qDMR YAML for use with
[qDMR / dmrconf](https://github.com/hmatuschek/qdmr).

All data stays in your browser (localStorage + IndexedDB). No accounts, no server
required: the app runs fully client-side and can be hosted on GitHub Pages.

## Status

Milestone 1 (foundation):

- SvelteKit + Svelte 5 static SPA (`adapter-static`, `ssr=false`).
- Internal model: a superset of the qDMR YAML format that preserves unknown keys
  and device-extension blocks on round-trip, plus app-only `wdmr*` attributes.
- qDMR YAML import/export with `!default` / `!selected` custom-tag support.
  Export can strip `wdmr*` for a dmrconf-clean file or keep them.
- Radio catalog generated from upstream qdmr (`scripts/gen-radios.mjs`).
- Multiple datasets open as horizontal tabs; collections (channels, contacts,
  zones, scan lists, roaming, ...) as a vertical menu; per-collection table with
  add / edit / delete.

Later milestones: CSV / SARL API import with a column-mapping wizard, filter &
bulk actions, copy-between-datasets, JSON-tree editor, and a dockerized `dmrconf`
conversion backend.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests (vitest)
npm run test:e2e     # end-to-end (playwright; needs `npx playwright install`)
npm run check        # svelte-check / types
```

## Build & deploy (GitHub Pages, /docs)

```bash
npm run build
```

The static site is written to `docs/` (with `.nojekyll`). Asset URLs are
**relative to `index.html`**, so the same build works unchanged at a domain root,
at a GitHub Pages project subpath (`https://<user>.github.io/<repo>/`), or even
opened straight from disk — no `BASE_PATH` needed. Point GitHub Pages at the
`docs/` folder of your default branch.

## Update the radio list

The dmrconf radio-type list is generated from a pinned qdmr tag:

```bash
npm run gen:radios   # rewrites src/lib/data/radios.json (needs network)
```

Bump `TAG` in `scripts/gen-radios.mjs` to track a newer qdmr release; keep it in
sync with the `dmrconf` version used by the (future) conversion backend.
