# Testi per la scheda store — Opera Add-ons

Materiale pronto da incollare nel form di submission su
<https://addons.opera.com/developer/>. Sezioni in Italiano e English.

---

## Nome / Name

```
Claude for Opera GX
```

## Categoria suggerita / Suggested category

Productivity

---

## Descrizione breve / Short description (≤ ~150 caratteri)

**IT**
```
Chatta con Claude (Anthropic) in una sidebar laterale su qualsiasi pagina. Usa la tua chiave API. Niente tracciamento.
```

**EN**
```
Chat with Claude (Anthropic) in a side panel on any web page. Bring your own API key. No tracking.
```

---

## Descrizione lunga / Long description

**IT**
```
Claude for Opera GX porta l'assistente AI Claude di Anthropic in una comoda
sidebar laterale, disponibile su qualsiasi pagina web — pensata per Opera GX,
che non supporta l'API chrome.sidePanel.

FUNZIONI
• Sidebar di chat richiamabile con un click sull'icona o con Alt+C
• Risposte in streaming, in tempo reale
• "Chiedi a Claude" sul testo selezionato, dal menu contestuale
• Opzione per includere il contenuto della pagina corrente nella conversazione
• Scelta del modello Claude e cronologia conversazioni salvata localmente

PRIVACY PRIMA DI TUTTO
• Nessun server proprio, nessuna telemetria, nessun tracciamento.
• I tuoi dati (chiave API, cronologia) restano nel tuo browser.
• I messaggi vengono inviati DIRETTAMENTE all'API di Anthropic, solo quando
  sei tu ad avviare una richiesta.
• Il contenuto della pagina viene letto solo su tua esplicita richiesta, mai
  in background.

REQUISITI
Questa estensione richiede una TUA chiave API di Anthropic. Puoi ottenerla su
console.anthropic.com. L'uso dell'API è soggetto ai costi e ai termini di
Anthropic. Senza chiave l'estensione non può generare risposte.

Privacy policy: https://github.com/silviodele/ClaudeGX/blob/main/PRIVACY.md
```

**EN**
```
Claude for Opera GX brings Anthropic's Claude AI assistant into a handy side
panel, available on any web page — built for Opera GX, which does not support
the chrome.sidePanel API.

FEATURES
• Chat side panel, opened with one click on the icon or with Alt+C
• Real-time streaming responses
• "Ask Claude" on selected text, from the context menu
• Option to include the current page's content in the conversation
• Claude model selection and locally stored conversation history

PRIVACY FIRST
• No servers of our own, no telemetry, no tracking.
• Your data (API key, history) stays in your browser.
• Messages are sent DIRECTLY to Anthropic's API, only when you start a request.
• Page content is read only when you explicitly ask for it, never in the
  background.

REQUIREMENTS
This extension requires YOUR OWN Anthropic API key. You can get one at
console.anthropic.com. API usage is subject to Anthropic's pricing and terms.
Without a key the extension cannot generate responses.

Privacy policy: https://github.com/silviodele/ClaudeGX/blob/main/PRIVACY.md
```

---

## Giustificazione permessi (per i revisori) / Permission justification

Da incollare nel campo note/giustificazione della review, se richiesto.

**EN**
```
- activeTab + scripting: the content script (which mounts the chat side panel
  iframe and, on user request, reads the current page's text) is injected
  on demand into the active tab only, when the user opens the panel via the
  toolbar icon, the Alt+C shortcut, or the context menu. The extension does
  NOT run on pages in the background.
- contextMenus: provides the "Ask Claude" action on selected text.
- storage: stores the user's API key, chosen model, and conversation history
  locally (chrome.storage.local). Nothing is sent anywhere except as below.
- host permission https://api.anthropic.com/*: the background service worker
  calls Anthropic's Messages API directly (streaming). This is the only
  network destination. No analytics or third-party endpoints are contacted.
```

---

## Asset grafici richiesti / Required graphic assets

| Asset | Specifica | Stato |
|---|---|---|
| Icona estensione | 128×128 PNG | ✅ presente (`icons/icon128.png`) |
| Icona store | 256×256 PNG | ✅ presente (`store/store-icon-256.png`) |
| Screenshot | almeno 1, es. 1280×800 PNG | ✅ presente (`store/store-screenshot-1280x800.png`) |

Gli asset store vivono in `store/` e sono esclusi dal pacchetto dell'estensione
(non rientrano nell'allowlist di `package.ps1`).
