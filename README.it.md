<div align="center">

<sub>🇮🇹 Italiano · <a href="README.md">🇬🇧 English</a></sub>

<img src="icons/icon128.png" width="88" alt="Claude for Opera GX">

# Claude for Opera GX

Una sidebar Claude per Opera GX — su ogni pagina,  
connessa direttamente all'API, senza server di mezzo.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-7c6cd1?style=flat-square)
![Opera GX](https://img.shields.io/badge/Opera_GX-ready-cc4e2a?style=flat-square&logo=opera&logoColor=white)
![Zero dipendenze](https://img.shields.io/badge/dipendenze-zero-3a9e6e?style=flat-square)

</div>

---

### Installa

```
opera://extensions  →  Modalità sviluppatore  →  Load unpacked  →  seleziona questa cartella
```

Poi **tasto destro sull'icona → Opzioni**, incolla la tua [API key Anthropic](https://console.anthropic.com/settings/keys) e salva.

---

### Usa

| Azione | Come |
|---|---|
| Apri / chiudi la sidebar | `Alt+C` o click sull'icona |
| Chiedi su testo selezionato | Tasto destro → *Chiedi a Claude: "…"* |
| Allega il contenuto della pagina | **📄** nella barra di input |
| Nuova conversazione | **⟲** |
| Invia / vai a capo | <kbd>Enter</kbd> / <kbd>Shift</kbd>+<kbd>Enter</kbd> |

Modello selezionabile direttamente nella sidebar: **Sonnet 4.6** · Opus 4.8 · Haiku 4.5

---

> **Privacy** — la API key non lascia mai il tuo browser.  
> Le richieste viaggiano direttamente da te ad Anthropic, senza proxy.

---

<div align="center">
<sub>Usa un iframe fisso invece della <code>chrome.sidePanel</code> API, non supportata da Opera GX.</sub>
</div>
