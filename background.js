// background.js — service worker (MV3)
// Gestisce: apertura sidebar via icona / scorciatoia / menu contestuale,
// e le chiamate streaming all'API Anthropic (così la sidebar non gestisce CORS).

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

// --- Apertura sidebar -------------------------------------------------------

async function toggleSidebar(tab) {
  if (!tab || !tab.id) {
    const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
    tab = active;
  }
  if (!tab || !tab.id) return;
  // Le pagine interne di Opera/Chrome non accettano content script.
  if (/^(opera|chrome|edge|about|view-source):/i.test(tab.url || "")) {
    return;
  }
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" });
  } catch (e) {
    // Content script non ancora iniettato (es. pagina aperta prima dell'install): lo inietto al volo.
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
      await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" });
    } catch (err) {
      console.warn("Impossibile aprire la sidebar su questa pagina:", err);
    }
  }
}

chrome.action.onClicked.addListener((tab) => toggleSidebar(tab));

chrome.commands.onCommand.addListener((cmd) => {
  if (cmd === "toggle-sidebar") toggleSidebar();
});

// --- Menu contestuale (testo selezionato) -----------------------------------

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ask-claude",
    title: "Chiedi a Claude: \"%s\"",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "ask-claude" && info.selectionText) {
    await toggleSidebar(tab);
    // Piccolo ritardo per dare tempo alla sidebar di montarsi.
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, {
        type: "PREFILL",
        text: info.selectionText
      }).catch(() => {});
    }, 350);
  }
});

// --- Chiamata API in streaming ----------------------------------------------
// La sidebar invia { type: "ASK", messages, model, system, port }.
// Rispondiamo in streaming usando una Port per inviare i chunk.

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "claude-stream") return;

  port.onMessage.addListener(async (msg) => {
    if (msg.type !== "ASK") return;

    const { apiKey, model, system, messages } = msg;

    if (!apiKey) {
      port.postMessage({ type: "ERROR", error: "NO_KEY" });
      return;
    }

    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": API_VERSION,
          // Necessario per chiamare l'API da contesto browser senza errori CORS.
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: model || "claude-sonnet-4-6",
          max_tokens: 4096,
          stream: true,
          system: system || undefined,
          messages
        })
      });

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const errBody = await res.json();
          detail = errBody?.error?.message || detail;
        } catch (_) {}
        port.postMessage({ type: "ERROR", error: detail });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop(); // l'ultima riga potrebbe essere incompleta

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (!data) continue;
          try {
            const evt = JSON.parse(data);
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
              port.postMessage({ type: "DELTA", text: evt.delta.text });
            } else if (evt.type === "message_stop") {
              port.postMessage({ type: "DONE" });
            } else if (evt.type === "error") {
              port.postMessage({ type: "ERROR", error: evt.error?.message || "Errore stream" });
            }
          } catch (_) {
            // riga non-JSON (es. evento ping), ignora
          }
        }
      }
      port.postMessage({ type: "DONE" });
    } catch (e) {
      port.postMessage({ type: "ERROR", error: e.message || String(e) });
    }
  });
});
