# lab.gaato.net

[![CI](https://github.com/gaato/lab.gaato.net/actions/workflows/ci.yml/badge.svg)](https://github.com/gaato/lab.gaato.net/actions/workflows/ci.yml)
[![CodeQL](https://github.com/gaato/lab.gaato.net/actions/workflows/codeql.yml/badge.svg)](https://github.com/gaato/lab.gaato.net/actions/workflows/codeql.yml)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Flab.gaato.net)](https://lab.gaato.net)
[![Ask DeepWiki](https://img.shields.io/badge/Ask-DeepWiki-blue)](https://deepwiki.com/gaato/lab.gaato.net)
[![License](https://img.shields.io/github/license/gaato/lab.gaato.net)](LICENSE)

Source code for [lab.gaato.net](https://lab.gaato.net), a collection of small calculators and web experiments.

Some pages are unofficial fan-made tools for hololive Dreams. This project is not affiliated with COVER Corporation or the game's developers or operators, and it does not include official artwork or in-game assets.

## Development

```fish
bun install
bun run dev
```

To run the full verification suite:

```fish
bun run verify
```

### Ignored audit advisories

`bun run audit` (run in CI) ignores these advisories. Remove an entry once its condition is met.

- [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) (picomatch ReDoS, CVE-2026-112366): no patched release exists yet and the advisory is disputed ([micromatch/picomatch#234](https://github.com/micromatch/picomatch/issues/234)). It requires attacker-controlled glob patterns, but picomatch is only reached through dev tooling (Vite, Vitest, svelte-check) with patterns from this repository, and it is not part of the static site. Remove the ignore when picomatch ships a fix or the advisory is withdrawn.

## License

Original code, tests, scripts, UI copy, documentation, and SVG files authored for this repository are licensed under the [Blue Oak Model License 1.0.0](LICENSE) (`BlueOak-1.0.0`). Third-party material is not covered. See [NOTICE.md](NOTICE.md) and [THIRD_PARTY_NOTICES.txt](static/THIRD_PARTY_NOTICES.txt).
