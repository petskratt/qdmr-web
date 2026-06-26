# Changelog

## Unreleased

### UI iteration: schema-driven editor, sortable tables, bulk actions

- Tables (`src/lib/ui/columns.ts`): per-collection columns; the internal `id` is
  never shown. Channels show the rep type after the name and, for FM channels,
  the opening (rx) sub-tone. All columns are sortable (click header) and there is
  a per-collection text filter.
- Multi-select + bulk actions (`src/lib/actions/bulk.ts`,
  `BulkActionsBar.svelte`): select rows, then add channels to a zone / scan list,
  set power, add a `wdmr` tag, or delete. Actions live in one module so new ones
  slot in easily.
- Schema-driven editor (`src/lib/schema/`): field definitions per collection /
  type taken from the qDMR manual (ch03). Reusable field widgets
  (`src/lib/components/fields/`): text, number, frequency, enum dropdown, boolean,
  reference dropdown ([None]/[Default]/[Selected]), reference multi-select, and a
  CTCSS/DCS tone control. Numeric/enum fields that support the radio default show
  a Default checkbox (emits `!default`). The editor splits Basic vs Extensions
  (extended qDMR settings + raw device-extension / `wdmr*` keys); `id` is fixed
  and mandatory fields are not add/deletable.
- Fixed a Svelte 5 reactivity bug: a newly added element was tracked by a stale
  (unproxied) reference, so editor changes never reached the table. The table now
  resolves the editing element from the reactive array by uid.
- Tests: +13 (schema value helpers, bulk actions) and updated e2e (schema editor,
  bulk tagging). 26 unit + 3 e2e green.

### Milestone 1 — foundation

- Scaffold SvelteKit + Svelte 5 (runes) static SPA: `adapter-static`,
  `ssr=false`, `prerender`, `BASE_PATH` support, build output to `docs/` with
  `.nojekyll` for GitHub Pages. Bootstrap 5 SCSS (no JS) + bootstrap-icons.
- Internal model (`src/lib/model`): a qDMR superset that preserves unknown keys
  and device-extension blocks on round-trip, with open wrapper types
  (digital/analog/dmr/dtmf/aprs/plain) and app-only `wdmr*` attributes.
- qDMR YAML codec (`src/lib/io/yaml`): tolerant import and faithful export with
  `!default` / `!selected` custom-tag support; `dmrconfClean` option strips
  `wdmr*` so dmrconf's verifier never sees unknown keys. Bare tags render without
  a trailing `null`.
- Radio catalog: `scripts/gen-radios.mjs` parses qdmr `lib/radioinfo.cc` +
  device files at a pinned tag (v0.15.1) into `src/lib/data/radios.json`
  (27 radios, alias-resolved). Typed loader doubles as the `--radio` allowlist.
- Storage (`src/lib/state`): localStorage index/prefs + IndexedDB dataset
  payloads behind one module; TaggedValue-aware (de)serialization; runes-based
  workspace state (open tabs, active dataset/collection) restored across reloads.
- UI: horizontal dataset tabs, vertical collection sidebar, per-collection table
  with add / edit / delete and a simple field editor (scalar / list / tag / json
  modes). qDMR YAML import (file picker) and export (clean / with-wdmr).
- Tests: 13 unit tests (codec round-trip, tags, wdmr strip, serialization, radio
  catalog) + Playwright smoke specs.
