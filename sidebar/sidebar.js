// sidebar.js — logica della chat

const MODELS = [
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6" },
  { id: "claude-opus-4-8", label: "Opus 4.8" },
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5" }
];

const SYSTEM_PROMPT =
  "Sei Claude, un assistente integrato in una sidebar del browser. " +
  "Rispondi in modo conciso e diretto, nella lingua dell'utente.";

const els = {
  thread: document.getElementById("thread"),
  empty: document.getElementById("empty"),
  input: document.getElementById("input"),
  send: document.getElementById("send"),
  clear: document.getElementById("clear"),
  settings: document.getElementById("settings"),
  close: document.getElementById("close"),
  model: document.getElementById("model"),
  warning: document.getElementById("key-warning"),
  openSettingsInline: document.getElementById("open-settings-inline"),
  pageToggle: document.getElementById("page-toggle"),
  pageStatus: document.getElementById("page-status")
};

let includePage = false;

let history = [];   // [{role, content}]
let apiKey = null;
let busy = false;

// ---- Init ------------------------------------------------------------------

MODELS.forEach((m) => {
  const opt = document.createElement("option");
  opt.value = m.id;
  opt.textContent = m.label;
  els.model.appendChild(opt);
});

(async function init() {
  const store = await chrome.storage.local.get(["apiKey", "model", "history"]);
  apiKey = store.apiKey || null;
  els.model.value = store.model || MODELS[0].id;
  if (Array.isArray(store.history)) {
    history = store.history;
    history.forEach((m) => renderMessage(m.role, m.display || m.content, false, m.withPage));
    if (history.length) els.empty.classList.add("hidden");
  }
  els.warning.classList.toggle("hidden", !!apiKey);
})();

els.pageToggle.addEventListener("click", () => {
  includePage = !includePage;
  els.pageToggle.classList.toggle("active", includePage);
  els.pageStatus.textContent = includePage ? "📄 pagina inclusa · " : "";
  els.pageStatus.style.color = includePage ? "var(--accent)" : "";
});

// ---- UI events -------------------------------------------------------------

els.input.addEventListener("input", () => {
  els.input.style.height = "auto";
  els.input.style.height = Math.min(els.input.scrollHeight, 160) + "px";
});

els.input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    submit();
  }
});

els.send.addEventListener("click", submit);
els.close.addEventListener("click", () => parent.postMessage({ type: "CLAUDE_GX_CLOSE" }, "*"));
els.settings.addEventListener("click", () => chrome.runtime.openOptionsPage());
els.openSettingsInline.addEventListener("click", () => chrome.runtime.openOptionsPage());
els.model.addEventListener("change", () => chrome.storage.local.set({ model: els.model.value }));

els.clear.addEventListener("click", () => {
  history = [];
  chrome.storage.local.set({ history: [] });
  [...els.thread.querySelectorAll(".msg")].forEach((n) => n.remove());
  els.empty.classList.remove("hidden");
});

// Prefill da menu contestuale (testo selezionato)
window.addEventListener("message", (e) => {
  if (e.data && e.data.type === "PREFILL") {
    els.input.value = e.data.text;
    els.input.dispatchEvent(new Event("input"));
    els.input.focus();
  }
});

// Aggiorna lo stato se la key cambia nelle impostazioni mentre la sidebar è aperta
chrome.storage.onChanged.addListener((changes) => {
  if (changes.apiKey) {
    apiKey = changes.apiKey.newValue || null;
    els.warning.classList.toggle("hidden", !!apiKey);
  }
});

// ---- Invio messaggio -------------------------------------------------------

async function submit() {
  const text = els.input.value.trim();
  if (!text || busy) return;

  if (!apiKey) {
    els.warning.classList.remove("hidden");
    return;
  }

  els.empty.classList.add("hidden");
  els.input.value = "";
  els.input.style.height = "auto";

  // Se richiesto, allega il contenuto della pagina come contesto.
  let apiContent = text;
  let withPage = false;
  if (includePage) {
    const page = await requestPageContent();
    if (page && page.text) {
      withPage = true;
      apiContent =
        "Contenuto della pagina web attualmente aperta.\n" +
        `Titolo: ${page.title}\nURL: ${page.url}\n\n` +
        `"""\n${page.text}\n"""` +
        (page.truncated ? "\n[Contenuto troncato per lunghezza]" : "") +
        "\n\n---\nDomanda dell'utente su questa pagina:\n" +
        text;
    }
  }

  // In history salviamo il contenuto completo (per l'API) ma mostriamo solo la domanda.
  history.push({ role: "user", content: apiContent, display: text, withPage });
  renderMessage("user", text, false, withPage);

  busy = true;
  els.send.disabled = true;

  const assistantEl = renderMessage("assistant", "", true);
  const bubble = assistantEl.querySelector(".bubble");
  bubble.classList.add("cursor");

  let acc = "";
  const port = chrome.runtime.connect({ name: "claude-stream" });

  port.onMessage.addListener((msg) => {
    if (msg.type === "DELTA") {
      acc += msg.text;
      bubble.innerHTML = renderMarkdown(acc);
      scrollToBottom();
    } else if (msg.type === "DONE") {
      finish();
    } else if (msg.type === "ERROR") {
      bubble.classList.remove("cursor");
      const m = msg.error === "NO_KEY"
        ? "API key mancante. Aprila nelle impostazioni."
        : "Errore: " + msg.error;
      bubble.innerHTML = `<p style="color:#ff8095">${escapeHtml(m)}</p>`;
      // rimuovi il turn assistant fallito dalla storia
      teardown();
    }
  });

  function finish() {
    bubble.classList.remove("cursor");
    if (acc.trim()) {
      history.push({ role: "assistant", content: acc });
      chrome.storage.local.set({ history });
    }
    teardown();
  }

  function teardown() {
    busy = false;
    els.send.disabled = false;
    try { port.disconnect(); } catch (_) {}
    els.input.focus();
  }

  port.postMessage({
    type: "ASK",
    apiKey,
    model: els.model.value,
    system: SYSTEM_PROMPT,
    messages: history.map(({ role, content }) => ({ role, content }))
  });
}

// ---- Rendering -------------------------------------------------------------

function renderMessage(role, content, returnEl = false, withPage = false) {
  const wrap = document.createElement("div");
  wrap.className = "msg " + role;
  const roleEl = document.createElement("div");
  roleEl.className = "role";
  roleEl.textContent = role === "user" ? "Tu" : "Claude";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = renderMarkdown(content);
  wrap.appendChild(roleEl);
  wrap.appendChild(bubble);
  if (withPage) {
    const badge = document.createElement("span");
    badge.className = "badge-page";
    badge.textContent = "📄 con contenuto pagina";
    wrap.appendChild(badge);
  }
  els.thread.appendChild(wrap);
  scrollToBottom();
  return wrap;
}

// Chiede al content script (pagina ospite) il testo della pagina.
function requestPageContent() {
  return new Promise((resolve) => {
    function handler(e) {
      if (e.data && e.data.type === "PAGE_CONTENT") {
        window.removeEventListener("message", handler);
        resolve(e.data);
      }
    }
    window.addEventListener("message", handler);
    parent.postMessage({ type: "GET_PAGE_CONTENT" }, "*");
    // timeout di sicurezza se la pagina non risponde
    setTimeout(() => {
      window.removeEventListener("message", handler);
      resolve(null);
    }, 3000);
  });
}

function scrollToBottom() {
  els.thread.scrollTop = els.thread.scrollHeight;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Mini renderer Markdown (no librerie esterne, sicuro per CSP).
function renderMarkdown(text) {
  if (!text) return "";
  // Blocchi di codice ``` ```
  const codeBlocks = [];
  text = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
    codeBlocks.push(`<pre><code>${escapeHtml(code.replace(/\n$/, ""))}</code></pre>`);
    return `\u0000${codeBlocks.length - 1}\u0000`;
  });

  let html = escapeHtml(text);

  // inline code
  html = html.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  // bold
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // italic
  html = html.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");

  // liste e paragrafi
  const lines = html.split("\n");
  let out = "";
  let inList = false;
  for (let line of lines) {
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) { out += "<ul>"; inList = true; }
      out += "<li>" + line.replace(/^\s*[-*]\s+/, "") + "</li>";
    } else {
      if (inList) { out += "</ul>"; inList = false; }
      if (line.trim() === "") out += "";
      else out += "<p>" + line + "</p>";
    }
  }
  if (inList) out += "</ul>";

  // ripristina i blocchi di codice
  out = out.replace(/\u0000(\d+)\u0000/g, (_, i) => codeBlocks[+i]);
  return out;
}
