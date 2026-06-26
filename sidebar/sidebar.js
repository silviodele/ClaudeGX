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
  updateSendState();
})();

els.pageToggle.addEventListener("click", () => {
  includePage = !includePage;
  els.pageToggle.classList.toggle("active", includePage);
  els.pageToggle.setAttribute("aria-pressed", String(includePage));
  els.pageStatus.textContent = includePage ? "Pagina inclusa · " : "";
  els.pageStatus.style.color = includePage ? "var(--accent)" : "";
});

// ---- UI events -------------------------------------------------------------

// Send reflects whether there's anything to send (and isn't mid-stream).
function updateSendState() {
  els.send.disabled = busy || els.input.value.trim() === "";
}

els.input.addEventListener("input", () => {
  els.input.style.height = "auto";
  els.input.style.height = Math.min(els.input.scrollHeight, 160) + "px";
  updateSendState();
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
  updateSendState();

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

  streamAssistant();
}

// Streams one assistant turn against the current history.
// Reused by submit() and by the "Riprova" action after an error.
function streamAssistant() {
  busy = true;
  updateSendState();

  const assistantEl = renderMessage("assistant", "", true);
  const bubble = assistantEl.querySelector(".bubble");
  // "Thinking" indicator until the first token arrives.
  bubble.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';

  let acc = "";
  let started = false;
  const port = chrome.runtime.connect({ name: "claude-stream" });

  port.onMessage.addListener((msg) => {
    if (msg.type === "DELTA") {
      if (!started) {
        started = true;
        bubble.classList.add("cursor");
      }
      acc += msg.text;
      bubble.innerHTML = renderMarkdown(acc);
      scrollToBottom();
    } else if (msg.type === "DONE") {
      finish();
    } else if (msg.type === "ERROR") {
      fail(msg.error);
    }
  });

  function finish() {
    bubble.classList.remove("cursor");
    if (acc.trim()) {
      history.push({ role: "assistant", content: acc });
      chrome.storage.local.set({ history });
    } else {
      assistantEl.remove();
    }
    teardown();
  }

  function fail(error) {
    const message = error === "NO_KEY"
      ? "Nessuna API key impostata. Aprila nelle impostazioni."
      : "Qualcosa è andato storto: " + error;
    assistantEl.className = "msg error";
    bubble.classList.remove("cursor");
    bubble.innerHTML = `<p>${escapeHtml(message)}</p>`;

    const retry = document.createElement("button");
    retry.className = "retry";
    retry.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>Riprova';
    retry.addEventListener("click", () => {
      assistantEl.remove();
      streamAssistant();
    });
    assistantEl.appendChild(retry);
    scrollToBottom();
    teardown();
  }

  function teardown() {
    busy = false;
    updateSendState();
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
    badge.textContent = "Pagina inclusa";
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

// Formattazione inline (su testo già HTML-escaped): codice, link, grassetto, corsivo.
function inlineMarkdown(text) {
  // Codice inline `...` — protegge il contenuto dalle altre regole.
  const codeSpans = [];
  text = text.replace(/`([^`]+)`/g, (_, c) => {
    codeSpans.push(`<code>${c}</code>`);
    return `${codeSpans.length - 1}`;
  });
  // Link [testo](url) — solo schemi sicuri.
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
    if (!/^(https?:|mailto:)/i.test(url)) return m;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  // Grassetto **...**
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Corsivo *...*
  text = text.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  // Ripristina il codice inline.
  return text.replace(/(\d+)/g, (_, i) => codeSpans[+i]);
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

  const html = escapeHtml(text);
  const lines = html.split("\n");
  let out = "";
  let listType = null; // "ul" | "ol" | null

  const closeList = () => { if (listType) { out += `</${listType}>`; listType = null; } };

  for (const line of lines) {
    const trimmed = line.trim();
    // Segnaposto di un blocco di codice da solo: niente <p> attorno.
    if (/^ \d+ $/.test(trimmed)) { closeList(); out += trimmed; continue; }
    // Riga orizzontale (---, ***, ___).
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { closeList(); out += "<hr>"; continue; }
    // Titoli (# .. ###).
    const h = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (h) { closeList(); const lvl = Math.min(h[1].length, 3); out += `<h${lvl}>${inlineMarkdown(h[2])}</h${lvl}>`; continue; }
    // Citazione.
    const bq = line.match(/^\s*>\s?(.*)$/);
    if (bq) { closeList(); out += `<blockquote>${inlineMarkdown(bq[1])}</blockquote>`; continue; }
    // Lista numerata.
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ol) { if (listType !== "ol") { closeList(); out += "<ol>"; listType = "ol"; } out += `<li>${inlineMarkdown(ol[1])}</li>`; continue; }
    // Lista puntata.
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ul) { if (listType !== "ul") { closeList(); out += "<ul>"; listType = "ul"; } out += `<li>${inlineMarkdown(ul[1])}</li>`; continue; }
    // Riga vuota.
    if (trimmed === "") { closeList(); continue; }
    // Paragrafo.
    closeList();
    out += `<p>${inlineMarkdown(line)}</p>`;
  }
  closeList();

  // ripristina i blocchi di codice
  out = out.replace(/\u0000(\d+)\u0000/g, (_, i) => codeBlocks[+i]);
  return out;
}
