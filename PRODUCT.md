# Product

## Register

product

## Users

Technically confident Opera GX users — developers, power users, and enthusiasts
who already have (or can get) an Anthropic API key and bring their own. They
work across arbitrary web pages and want Claude available in place, without
leaving the tab. Their context is hands-on and fast-moving: they expect the
sidebar to open instantly (icon click or `Alt+C`), stream responses in real
time, optionally pull in the current page's text, and stay out of the way the
rest of the time. The settings page is a one-time setup chore — paste a key,
pick a model, done — and a backup/restore safety net.

## Product Purpose

Opera GX has no `chrome.sidePanel` API, so this extension delivers a Claude chat
sidebar as a fixed iframe injected into any page. It exists to make Claude a
persistent, page-aware companion in the browser the user already lives in.
Success looks like: zero-friction setup, a sidebar that feels native to GX,
streaming chat that never stutters, and "ask Claude about this page / this
selection" working reliably. The product owns no server and no telemetry — the
API key and history live only in `chrome.storage.local`, and requests go
directly to Anthropic only when the user initiates them.

## Brand Personality

Sharp, energetic, confident — the Opera GX racing aesthetic. Near-black surfaces,
a single hot-red accent (`#ff2e55`) used with restraint and glow, crisp edges,
snappy and purposeful motion. The voice is direct and efficient (currently
Italian-first). It should feel like a tool built for people who move fast, not a
toy and not a corporate app. Three words: **fast, focused, GX-native.**

## Anti-references

- **Generic SaaS.** No corporate light-mode, no safe blue accent, no endless
  rounded-card dashboards. This is GX, not a B2B admin panel.
- **The warm/cream "AI default" palette.** No beige/sand/parchment near-whites,
  no warm-tinted neutrals. The identity is dark and high-contrast by design.
- **Decorative glassmorphism** and effects-for-their-own-sake. The red glow is a
  signature, not a default coat of paint — every effect earns its place.
- **Clutter.** The sidebar is narrow; controls stay breathable and uncluttered.

## Design Principles

1. **GX-native, not generic.** The dark surface + hot-red accent is the brand
   anchor. Preserve it; never drift toward a neutral or off-brand palette.
2. **Get out of the way.** This is a companion in someone else's tab. Chrome is
   minimal, the thread is the focus, and motion serves feedback — not flourish.
3. **Speed is the feature.** Instant open, real-time streaming, snappy
   interactions. Anything that adds perceived latency is a regression.
4. **Privacy is visible trust.** The local-only, no-telemetry, you-bring-the-key
   model is a selling point — surface it honestly, never bury it.
5. **Restraint with the accent.** One hot color, used deliberately for state and
   emphasis. Glow is a signature, not a texture.

## Accessibility & Inclusion

Target **WCAG AA**: body text ≥ 4.5:1, large text ≥ 3:1 against the dark
surfaces (audit muted grays like `--muted: #888fa0` and placeholder text against
their actual backgrounds). Honor `prefers-reduced-motion` (already wired in the
sidebar) across every animated surface, including the settings page. Keep all
controls keyboard-reachable with visible focus states, and don't rely on the red
accent alone to convey state.

## Constraints (observed)

- **No build step.** Plain HTML/CSS/JS, Manifest V3, loads unpacked as-is. No
  bundler, framework, or npm dependencies.
- **Italian-first copy** is the current default; keep new copy consistent.
- Model list is duplicated in `sidebar/sidebar.js` and `options/options.js`.
