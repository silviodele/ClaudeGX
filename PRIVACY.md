# Privacy Policy — Claude for Opera GX

_Last updated: 2026-06-25_

[Italiano](#italiano) · [English](#english)

---

## Italiano

**Claude for Opera GX** ("l'estensione") è un client che permette di
chattare con i modelli Claude di Anthropic da una sidebar laterale su
qualsiasi pagina web. Questo documento descrive quali dati l'estensione
tratta e come.

### Sintesi

- L'estensione **non ha server propri** e **non raccoglie alcun dato** a
  beneficio dello sviluppatore.
- **Nessuna telemetria, nessun analytics, nessun tracciamento.**
- Gli unici dati che escono dal tuo browser vengono inviati **direttamente**
  all'API di Anthropic, e solo quando avvii tu una richiesta.

### Dati trattati e dove vengono conservati

| Dato | Dove viene conservato | A chi viene inviato |
|---|---|---|
| Chiave API Anthropic | Solo localmente, in `chrome.storage.local` | Inviata ad Anthropic a ogni richiesta per autenticarti |
| Modello selezionato | Solo localmente, in `chrome.storage.local` | — |
| Cronologia conversazioni | Solo localmente, in `chrome.storage.local` | Il contenuto viene inviato ad Anthropic per generare le risposte |
| Testo della pagina corrente | In memoria, solo quando lo richiedi esplicitamente | Incluso nel messaggio inviato ad Anthropic, se attivi l'opzione |
| Testo selezionato (menu contestuale) | In memoria | Incluso nel messaggio inviato ad Anthropic |

### Estrazione del contenuto della pagina

L'estensione **non legge le pagine in background**. Il contenuto di una
pagina viene estratto **solo** quando apri la sidebar e scegli di includere
la pagina nella conversazione (o usi il comando "Chiedi a Claude" su un
testo selezionato). Lo script di lettura viene iniettato on-demand nella
sola scheda attiva, tramite il permesso `activeTab`, e non su tutte le
pagine che visiti.

### Invio dei dati ad Anthropic

Quando invii un messaggio, i contenuti della conversazione (incluso
l'eventuale testo della pagina) e la tua chiave API vengono trasmessi
**direttamente** dal tuo browser a `https://api.anthropic.com`. L'estensione
non fa transitare questi dati attraverso alcun server intermedio.

Il trattamento dei dati da parte di Anthropic è regolato dalla privacy
policy di Anthropic: <https://www.anthropic.com/legal/privacy>.

### Cancellazione dei dati

- La cronologia può essere cancellata in qualsiasi momento dal pulsante di
  pulizia nella sidebar.
- Chiave API, modello e cronologia vengono rimossi disinstallando
  l'estensione.

### Contatti

Per domande sulla privacy: antonio.silvio.deletteriis@flashbattery.tech

---

## English

**Claude for Opera GX** ("the extension") is a client that lets you chat
with Anthropic's Claude models from a side panel on any web page. This
document describes what data the extension processes and how.

### Summary

- The extension has **no servers of its own** and **collects no data** for
  the developer.
- **No telemetry, no analytics, no tracking.**
- The only data that leaves your browser is sent **directly** to Anthropic's
  API, and only when you initiate a request.

### Data processed and where it is stored

| Data | Where it is stored | Who it is sent to |
|---|---|---|
| Anthropic API key | Locally only, in `chrome.storage.local` | Sent to Anthropic with each request to authenticate you |
| Selected model | Locally only, in `chrome.storage.local` | — |
| Conversation history | Locally only, in `chrome.storage.local` | Its content is sent to Anthropic to generate replies |
| Current page text | In memory, only when you explicitly request it | Included in the message sent to Anthropic, if you enable the option |
| Selected text (context menu) | In memory | Included in the message sent to Anthropic |

### Page content extraction

The extension **does not read pages in the background**. A page's content
is extracted **only** when you open the side panel and choose to include the
page in the conversation (or use the "Ask Claude" command on selected text).
The reader script is injected on demand into the active tab only, via the
`activeTab` permission — never across all the pages you visit.

### Sending data to Anthropic

When you send a message, the conversation content (including any page text)
and your API key are transmitted **directly** from your browser to
`https://api.anthropic.com`. The extension does not route this data through
any intermediary server.

Anthropic's handling of this data is governed by Anthropic's privacy policy:
<https://www.anthropic.com/legal/privacy>.

### Deleting your data

- History can be cleared at any time using the clear button in the side panel.
- Your API key, model, and history are removed when you uninstall the
  extension.

### Contact

Privacy questions: antonio.silvio.deletteriis@flashbattery.tech
