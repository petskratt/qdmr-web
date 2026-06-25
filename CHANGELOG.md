# Changelog

## Unreleased

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
