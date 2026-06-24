<div align="center">

<sub><a href="README.it.md">🇮🇹 Italiano</a> · 🇬🇧 English</sub>

<img src="icons/icon128.png" width="88" alt="Claude for Opera GX">

# Claude for Opera GX

A Claude sidebar for Opera GX — on every page,  
directly connected to the API, no server in between.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-7c6cd1?style=flat-square)
![Opera GX](https://img.shields.io/badge/Opera_GX-ready-cc4e2a?style=flat-square&logo=opera&logoColor=white)
![Zero dependencies](https://img.shields.io/badge/dependencies-zero-3a9e6e?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

</div>

---

### Install

```
opera://extensions  →  Developer mode  →  Load unpacked  →  select this folder
```

Then **right-click the icon → Options**, paste your [Anthropic API key](https://console.anthropic.com/settings/keys) and save.

---

### Use

| Action | How |
|---|---|
| Open / close the sidebar | `Alt+C` or click the icon |
| Ask about selected text | Right-click → *Ask Claude: "…"* |
| Attach the current page | **📄** in the input bar |
| New conversation | **⟲** |
| Send / new line | <kbd>Enter</kbd> / <kbd>Shift</kbd>+<kbd>Enter</kbd> |

Model selectable directly in the sidebar: **Sonnet 4.6** · Opus 4.8 · Haiku 4.5

---

> **Privacy** — your API key never leaves your browser.  
> Requests go directly from you to Anthropic, no proxy involved.

---

<div align="center">
<sub>Uses a fixed iframe instead of the <code>chrome.sidePanel</code> API, which Opera GX does not support.</sub>
</div>
